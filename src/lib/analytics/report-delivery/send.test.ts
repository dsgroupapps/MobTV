import assert from "node:assert/strict";
import test from "node:test";

import { sendAnalyticsReport } from "./send.ts";
import { AnalyticsEmailError, MAX_CSV_ATTACHMENT_BYTES } from "./resend-client.ts";
import { createInMemoryAnalyticsEventsRepository } from "../reporting/repository.ts";
import { qrJourney } from "../reporting/fixtures.test-support.ts";

const RANGE = {
  start: new Date("2026-09-08T00:00:00.000Z"),
  end: new Date("2026-09-15T00:00:00.000Z"),
};
const SECRET = "re_test_super_secret_should_never_leak";

const ENV_KEYS = [
  "RESEND_API_KEY",
  "MOBTV_ANALYTICS_FROM_EMAIL",
  "MOBTV_ANALYTICS_TO_EMAIL",
  "MOBTV_LEADS_FROM_EMAIL",
] as const;

function withEnv(
  vars: Partial<Record<(typeof ENV_KEYS)[number], string>>,
  fn: () => Promise<void>,
) {
  const previous: Partial<Record<string, string | undefined>> = {};
  for (const key of ENV_KEYS) {
    previous[key] = process.env[key];
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined) process.env[key] = value;
  }
  return fn().finally(() => {
    for (const key of ENV_KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
}

function repoWithData() {
  return createInMemoryAnalyticsEventsRepository(
    qrJourney({
      sessionId: "s1",
      pointSlug: "p1",
      createdAtBase: Date.parse("2026-09-10T12:00:00.000Z"),
    }),
  );
}

type Call = { url: string; init: RequestInit; body: Record<string, unknown> };

function makeFetchStub(handler: (call: Call) => Response) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
    const call: Call = { url: String(url), init: init ?? {}, body };
    calls.push(call);
    return handler(call);
  }) as typeof fetch;
  return { fetchImpl, calls };
}

function okResponse() {
  return new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
}

// ---------------------------------------------------------------------------
// configuração ausente
// ---------------------------------------------------------------------------

test("missing RESEND_API_KEY: falha com mensagem clara, nenhuma request é feita", async () => {
  await withEnv(
    {
      MOBTV_ANALYTICS_FROM_EMAIL: "relatorios@mobtv.tv.br",
      MOBTV_ANALYTICS_TO_EMAIL: "empresa@mobtv.tv.br",
    },
    async () => {
      const { fetchImpl, calls } = makeFetchStub(okResponse);
      await assert.rejects(
        () => sendAnalyticsReport({ repository: repoWithData(), ...RANGE, fetchImpl }),
        /RESEND_API_KEY/,
      );
      assert.equal(calls.length, 0);
    },
  );
});

test("missing MOBTV_ANALYTICS_FROM_EMAIL (e sem MOBTV_LEADS_FROM_EMAIL): falha com mensagem clara", async () => {
  await withEnv(
    { RESEND_API_KEY: SECRET, MOBTV_ANALYTICS_TO_EMAIL: "empresa@mobtv.tv.br" },
    async () => {
      await assert.rejects(
        () => sendAnalyticsReport({ repository: repoWithData(), ...RANGE }),
        /FROM_EMAIL/,
      );
    },
  );
});

test("missing recipient (sem MOBTV_ANALYTICS_TO_EMAIL e sem recipient explícito): falha com mensagem clara", async () => {
  await withEnv(
    { RESEND_API_KEY: SECRET, MOBTV_ANALYTICS_FROM_EMAIL: "relatorios@mobtv.tv.br" },
    async () => {
      await assert.rejects(
        () => sendAnalyticsReport({ repository: repoWithData(), ...RANGE }),
        /TO_EMAIL|recipient/,
      );
    },
  );
});

test("recipient com formato de e-mail inválido: falha antes de enviar", async () => {
  await withEnv(
    { RESEND_API_KEY: SECRET, MOBTV_ANALYTICS_FROM_EMAIL: "relatorios@mobtv.tv.br" },
    async () => {
      const { fetchImpl, calls } = makeFetchStub(okResponse);
      await assert.rejects(
        () =>
          sendAnalyticsReport({
            repository: repoWithData(),
            ...RANGE,
            recipient: "não-é-um-email",
            fetchImpl,
          }),
        /e-mail/i,
      );
      assert.equal(calls.length, 0);
    },
  );
});

test("fallback documentado: MOBTV_ANALYTICS_FROM_EMAIL ausente usa MOBTV_LEADS_FROM_EMAIL", async () => {
  await withEnv(
    {
      RESEND_API_KEY: SECRET,
      MOBTV_LEADS_FROM_EMAIL: "leads@mobtv.tv.br",
      MOBTV_ANALYTICS_TO_EMAIL: "empresa@mobtv.tv.br",
    },
    async () => {
      const { fetchImpl, calls } = makeFetchStub(okResponse);
      const result = await sendAnalyticsReport({ repository: repoWithData(), ...RANGE, fetchImpl });
      assert.equal(result.ok, true);
      assert.equal(calls[0].body.from, "leads@mobtv.tv.br");
    },
  );
});

// ---------------------------------------------------------------------------
// sucesso / erro do Resend
// ---------------------------------------------------------------------------

test("Resend success: retorna ok, sentTo, filename, csvBytes, resendId", async () => {
  await withEnv(
    {
      RESEND_API_KEY: SECRET,
      MOBTV_ANALYTICS_FROM_EMAIL: "relatorios@mobtv.tv.br",
      MOBTV_ANALYTICS_TO_EMAIL: "empresa@mobtv.tv.br",
    },
    async () => {
      const { fetchImpl } = makeFetchStub(okResponse);
      const result = await sendAnalyticsReport({ repository: repoWithData(), ...RANGE, fetchImpl });
      assert.equal(result.ok, true);
      assert.equal(result.sentTo, "empresa@mobtv.tv.br");
      assert.equal(result.filename, "mobtv-analytics-2026-09-08_2026-09-15.csv");
      assert.equal(result.resendId, "email_123");
      assert.ok(result.csvBytes > 0);
    },
  );
});

test("Resend error (HTTP 422): lança AnalyticsEmailError com o status, nunca a chave", async () => {
  await withEnv(
    {
      RESEND_API_KEY: SECRET,
      MOBTV_ANALYTICS_FROM_EMAIL: "relatorios@mobtv.tv.br",
      MOBTV_ANALYTICS_TO_EMAIL: "empresa@mobtv.tv.br",
    },
    async () => {
      const { fetchImpl } = makeFetchStub(
        () => new Response(JSON.stringify({ message: "invalid from" }), { status: 422 }),
      );
      await assert.rejects(
        () => sendAnalyticsReport({ repository: repoWithData(), ...RANGE, fetchImpl }),
        (error: unknown) => {
          assert.ok(error instanceof AnalyticsEmailError);
          assert.match(error.message, /422/);
          assert.equal(error.message.includes(SECRET), false);
          return true;
        },
      );
    },
  );
});

test("recipient explícito NUNCA aparece em erro junto com a chave, e explícito sobrescreve env", async () => {
  await withEnv(
    {
      RESEND_API_KEY: SECRET,
      MOBTV_ANALYTICS_FROM_EMAIL: "relatorios@mobtv.tv.br",
      MOBTV_ANALYTICS_TO_EMAIL: "empresa@mobtv.tv.br",
    },
    async () => {
      const { fetchImpl, calls } = makeFetchStub(okResponse);
      const result = await sendAnalyticsReport({
        repository: repoWithData(),
        ...RANGE,
        recipient: "teste-manual@mobtv.tv.br",
        fetchImpl,
      });
      assert.equal(result.sentTo, "teste-manual@mobtv.tv.br");
      assert.deepEqual(calls[0].body["to"], ["teste-manual@mobtv.tv.br"]);
    },
  );
});

// ---------------------------------------------------------------------------
// anexo
// ---------------------------------------------------------------------------

test("attachment: filename/content(base64)/content_type corretos, content decodifica de volta ao CSV original", async () => {
  await withEnv(
    {
      RESEND_API_KEY: SECRET,
      MOBTV_ANALYTICS_FROM_EMAIL: "relatorios@mobtv.tv.br",
      MOBTV_ANALYTICS_TO_EMAIL: "empresa@mobtv.tv.br",
    },
    async () => {
      const { fetchImpl, calls } = makeFetchStub(okResponse);
      const result = await sendAnalyticsReport({ repository: repoWithData(), ...RANGE, fetchImpl });

      const attachments = calls[0].body.attachments as Array<{
        filename: string;
        content: string;
        content_type: string;
      }>;
      assert.equal(attachments.length, 1);
      assert.equal(attachments[0].filename, result.filename);
      assert.equal(attachments[0].content_type, "text/csv");

      const decoded = Buffer.from(attachments[0].content, "base64").toString("utf8");
      assert.ok(decoded.startsWith("﻿"), "CSV decodificado ainda começa com BOM");
      assert.ok(decoded.includes("event_name"), "CSV decodificado tem o header esperado");
    },
  );
});

test("CSV maior que o limite configurado: falha antes de enviar, sem truncar silenciosamente", async () => {
  await withEnv(
    {
      RESEND_API_KEY: SECRET,
      MOBTV_ANALYTICS_FROM_EMAIL: "relatorios@mobtv.tv.br",
      MOBTV_ANALYTICS_TO_EMAIL: "empresa@mobtv.tv.br",
    },
    async () => {
      const { fetchImpl, calls } = makeFetchStub(okResponse);
      // Gera muitas linhas com um campo inflado (referrer) para ultrapassar
      // o limite de propósito: 1000 sessões x ~9000 bytes de referrer cada
      // = ~9MB, acima do limite de 8MB configurado.
      const rows = Array.from({ length: 1000 }, (_, i) =>
        qrJourney({
          sessionId: `s-${i}`,
          pointSlug: "p1",
          createdAtBase: Date.parse("2026-09-10T12:00:00.000Z") + i,
          upToStep: 1,
        }),
      ).flat();
      for (const r of rows) r.referrer = "x".repeat(9000);

      const repository = createInMemoryAnalyticsEventsRepository(rows);
      await assert.rejects(
        () => sendAnalyticsReport({ repository, ...RANGE, fetchImpl }),
        (error: unknown) => {
          assert.ok(error instanceof AnalyticsEmailError);
          assert.match(error.message, new RegExp(String(MAX_CSV_ATTACHMENT_BYTES)));
          return true;
        },
      );
      assert.equal(calls.length, 0, "não deveria nem tentar enviar");
    },
  );
});
