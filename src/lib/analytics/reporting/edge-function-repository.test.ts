import assert from "node:assert/strict";
import test from "node:test";

import {
  createEdgeFunctionAnalyticsEventsRepository,
  splitIntoWindows,
  AnalyticsEdgeFunctionError,
} from "./repository.ts";
import { buildAnalyticsReportForRange } from "./report.ts";
import { row } from "./fixtures.test-support.ts";

const ENDPOINT = "https://vcatcyczpufqyfugwcyv.supabase.co/functions/v1/get-analytics-events";
const API_KEY = "test-secret-key-should-never-leak";

type Call = { url: string; init: RequestInit; body: Record<string, unknown> };

/** Fetch fake — nunca toca rede. Grava as chamadas e delega a resposta a `handler`. */
function makeFetchStub(handler: (call: Call, callIndex: number) => Response) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
    const call: Call = { url: String(url), init: init ?? {}, body };
    calls.push(call);
    return handler(call, calls.length - 1);
  }) as typeof fetch;
  return { fetchImpl, calls };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function repo(
  fetchImpl: typeof fetch,
  overrides: Partial<Parameters<typeof createEdgeFunctionAnalyticsEventsRepository>[0]> = {},
) {
  return createEdgeFunctionAnalyticsEventsRepository({
    apiKey: API_KEY,
    endpointUrl: ENDPOINT,
    fetchImpl,
    ...overrides,
  });
}

const RANGE = {
  start: new Date("2026-09-08T00:00:00.000Z"),
  end: new Date("2026-09-15T00:00:00.000Z"),
};

// ---------------------------------------------------------------------------
// request correto / header / includeTestEvents
// ---------------------------------------------------------------------------

test("monta a request corretamente: URL, método, header x-analytics-api-key, corpo com start/end/limit/cursor/includeTestEvents", async () => {
  const { fetchImpl, calls } = makeFetchStub(() =>
    jsonResponse({ rows: [], nextCursor: null, hasMore: false }),
  );

  await repo(fetchImpl).fetchEvents(RANGE, { includeTestEvents: true });

  assert.equal(calls.length, 1);
  const [call] = calls;
  assert.equal(call.url, ENDPOINT);
  assert.equal(call.init.method, "POST");
  assert.equal((call.init.headers as Record<string, string>)["x-analytics-api-key"], API_KEY);
  assert.equal(call.body.start, RANGE.start.toISOString());
  assert.equal(call.body.end, RANGE.end.toISOString());
  assert.equal(call.body.limit, 1000);
  assert.equal(call.body.cursor, null);
  assert.equal(call.body.includeTestEvents, true);
});

test("includeTestEvents:false (default) é enviado explicitamente como false, não omitido", async () => {
  const { fetchImpl, calls } = makeFetchStub(() =>
    jsonResponse({ rows: [], nextCursor: null, hasMore: false }),
  );
  await repo(fetchImpl).fetchEvents(RANGE);
  assert.equal(calls[0].body.includeTestEvents, false);
});

test("secret nunca aparece na mensagem de erro, mesmo num erro claramente causado pela credencial", async () => {
  const { fetchImpl } = makeFetchStub(() => jsonResponse({ error: "unauthorized" }, 401));

  await assert.rejects(
    () => repo(fetchImpl).fetchEvents(RANGE),
    (error: unknown) => {
      assert.ok(error instanceof AnalyticsEdgeFunctionError);
      assert.equal(error.message.includes(API_KEY), false, "a chave não pode aparecer na mensagem");
      return true;
    },
  );
});

// ---------------------------------------------------------------------------
// paginação
// ---------------------------------------------------------------------------

test("paginação de 1 página: hasMore:false já na primeira resposta", async () => {
  const { fetchImpl, calls } = makeFetchStub(() =>
    jsonResponse({ rows: [row({ id: "r1" })], nextCursor: null, hasMore: false }),
  );

  const result = await repo(fetchImpl).fetchEvents(RANGE);
  assert.equal(calls.length, 1);
  assert.deepEqual(
    result.map((r) => r.id),
    ["r1"],
  );
});

test("paginação de múltiplas páginas: segue nextCursor até hasMore:false, concatenando as linhas", async () => {
  const { fetchImpl, calls } = makeFetchStub((call) => {
    if (call.body.cursor === null) {
      return jsonResponse({ rows: [row({ id: "p1" })], nextCursor: "cursor-2", hasMore: true });
    }
    if (call.body.cursor === "cursor-2") {
      return jsonResponse({ rows: [row({ id: "p2" })], nextCursor: "cursor-3", hasMore: true });
    }
    return jsonResponse({ rows: [row({ id: "p3" })], nextCursor: null, hasMore: false });
  });

  const result = await repo(fetchImpl).fetchEvents(RANGE);
  assert.equal(calls.length, 3);
  assert.deepEqual(
    result.map((r) => r.id),
    ["p1", "p2", "p3"],
  );
});

test("cursor repetido: aborta com erro claro em vez de entrar em loop infinito", async () => {
  const { fetchImpl } = makeFetchStub(() =>
    jsonResponse({ rows: [row()], nextCursor: "same-cursor", hasMore: true }),
  );

  await assert.rejects(() => repo(fetchImpl).fetchEvents(RANGE), /cursor repetido/i);
});

test("hasMore:true sem nextCursor: aborta com erro claro (resposta inconsistente)", async () => {
  const { fetchImpl } = makeFetchStub(() =>
    jsonResponse({ rows: [row()], nextCursor: null, hasMore: true }),
  );

  await assert.rejects(
    () => repo(fetchImpl).fetchEvents(RANGE),
    /hasMore.*sem nextCursor|resposta inconsistente/i,
  );
});

// ---------------------------------------------------------------------------
// erros HTTP / rede / JSON
// ---------------------------------------------------------------------------

test("401: erro claro, sem vazar a chave", async () => {
  const { fetchImpl } = makeFetchStub(() => jsonResponse({}, 401));
  await assert.rejects(() => repo(fetchImpl).fetchEvents(RANGE), /401/);
});

test("500: erro claro com o status", async () => {
  const { fetchImpl } = makeFetchStub(() => jsonResponse({ error: "internal" }, 500));
  await assert.rejects(() => repo(fetchImpl).fetchEvents(RANGE), /500/);
});

test("falha de rede (fetch rejeita): vira AnalyticsEdgeFunctionError, não uma exceção crua", async () => {
  const fetchImpl = (async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch;

  await assert.rejects(
    () => repo(fetchImpl).fetchEvents(RANGE),
    (error: unknown) => {
      assert.ok(error instanceof AnalyticsEdgeFunctionError);
      assert.match(error.message, /rede|network/i);
      return true;
    },
  );
});

test("JSON inválido no corpo da resposta: erro claro, não uma exceção de parse crua", async () => {
  const fetchImpl = (async () =>
    new Response("isto não é json{{{", { status: 200 })) as typeof fetch;

  await assert.rejects(() => repo(fetchImpl).fetchEvents(RANGE), /JSON/i);
});

test("resposta malformada (rows não é array): rejeitada pela validação, não aceita silenciosamente", async () => {
  const { fetchImpl } = makeFetchStub(() =>
    jsonResponse({ rows: "não é um array", nextCursor: null, hasMore: false }),
  );
  await assert.rejects(() => repo(fetchImpl).fetchEvents(RANGE), /[Mm]alformada|rows/);
});

test("resposta malformada (hasMore ausente): rejeitada", async () => {
  const { fetchImpl } = makeFetchStub(() => jsonResponse({ rows: [], nextCursor: null }));
  await assert.rejects(() => repo(fetchImpl).fetchEvents(RANGE));
});

test("resposta malformada (row sem campos estruturais obrigatórios): rejeitada", async () => {
  const { fetchImpl } = makeFetchStub(
    () => jsonResponse({ rows: [{ id: "r1" }], nextCursor: null, hasMore: false }), // faltam created_at, event_name etc.
  );
  await assert.rejects(() => repo(fetchImpl).fetchEvents(RANGE));
});

test("sem ANALYTICS_API_KEY configurada: erro claro antes de qualquer request", async () => {
  const { fetchImpl, calls } = makeFetchStub(() =>
    jsonResponse({ rows: [], nextCursor: null, hasMore: false }),
  );
  const repository = createEdgeFunctionAnalyticsEventsRepository({
    apiKey: undefined,
    endpointUrl: ENDPOINT,
    fetchImpl,
  });
  await assert.rejects(() => repository.fetchEvents(RANGE), /ANALYTICS_API_KEY/);
  assert.equal(calls.length, 0, "nenhuma request é feita sem credencial");
});

// ---------------------------------------------------------------------------
// janelas de <=92 dias / >92 dias
// ---------------------------------------------------------------------------

test("splitIntoWindows: período <=92 dias vira UMA janela idêntica ao intervalo original", () => {
  const windows = splitIntoWindows(RANGE); // 7 dias
  assert.equal(windows.length, 1);
  assert.equal(windows[0].start.getTime(), RANGE.start.getTime());
  assert.equal(windows[0].end.getTime(), RANGE.end.getTime());
});

test("splitIntoWindows: período >92 dias é dividido em janelas consecutivas, sem buraco e sem sobreposição", () => {
  const range = {
    start: new Date("2026-01-01T00:00:00.000Z"),
    end: new Date("2026-12-01T00:00:00.000Z"),
  }; // 334 dias
  const windows = splitIntoWindows(range);

  assert.ok(windows.length >= 4, "334 dias / 92 = pelo menos 4 janelas");
  assert.equal(windows[0].start.getTime(), range.start.getTime());
  assert.equal(windows[windows.length - 1].end.getTime(), range.end.getTime());

  for (let i = 0; i < windows.length; i++) {
    const durationDays = (windows[i].end.getTime() - windows[i].start.getTime()) / 86_400_000;
    assert.ok(durationDays <= 92, `janela ${i} tem ${durationDays} dias, acima do limite`);
    if (i > 0) {
      assert.equal(
        windows[i].start.getTime(),
        windows[i - 1].end.getTime(),
        `janela ${i} não começa exatamente onde a anterior terminou (buraco ou sobreposição)`,
      );
    }
  }
});

test("período >92 dias: repository faz uma request por janela e concatena os resultados sem duplicar", async () => {
  const range = {
    start: new Date("2026-01-01T00:00:00.000Z"),
    end: new Date("2026-12-01T00:00:00.000Z"),
  };
  const expectedWindows = splitIntoWindows(range);

  const { fetchImpl, calls } = makeFetchStub((call, index) =>
    jsonResponse({
      rows: [row({ id: `window-${index}`, created_at: String(call.body.start) })],
      nextCursor: null,
      hasMore: false,
    }),
  );

  const result = await repo(fetchImpl).fetchEvents(range);

  assert.equal(calls.length, expectedWindows.length, "uma request por janela");
  assert.equal(result.length, expectedWindows.length, "uma linha por janela, sem duplicar");
  assert.deepEqual(
    calls.map((c) => c.body.start),
    expectedWindows.map((w) => w.start.toISOString()),
  );
  assert.deepEqual(
    calls.map((c) => c.body.end),
    expectedWindows.map((w) => w.end.toISOString()),
  );
});

// ---------------------------------------------------------------------------
// integração com buildAnalyticsReportForRange (mock HTTP, sem rede real)
// ---------------------------------------------------------------------------

test("integração: buildAnalyticsReportForRange usando o repository de Edge Function (mock) gera um relatório coerente", async () => {
  const { fetchImpl } = makeFetchStub((call) =>
    jsonResponse({
      rows: [
        row({
          id: "r1",
          event_name: "qr_landing",
          event_domain: "funnel",
          session_id: "s1",
          initial_point_slug: "hospital-do-gama",
          source: "qr",
          created_at: String(call.body.start),
        }),
      ],
      nextCursor: null,
      hasMore: false,
    }),
  );

  const report = await buildAnalyticsReportForRange(repo(fetchImpl), {
    start: new Date("2026-09-08T00:00:00.000Z"),
    end: new Date("2026-09-15T00:00:00.000Z"),
  });

  assert.equal(report.overview.qrLandings, 1);
  assert.equal(report.points[0]?.pointSlug, "hospital-do-gama");
});
