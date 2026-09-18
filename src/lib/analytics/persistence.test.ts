import assert from "node:assert/strict";
import test from "node:test";

import { insertAnalyticsEvent, mapFunnelEventToRow, mapPointEventToRow } from "./persistence.ts";
import type { FunnelEventPayload, PointEventPayload } from "./types.ts";

// ---------------------------------------------------------------------------
// Fixtures — shape idêntica ao que client.ts/funnel.ts realmente montam hoje
// (ver src/lib/analytics/client.ts e src/lib/analytics/funnel.ts).
// ---------------------------------------------------------------------------

function pointPayload(overrides: Partial<PointEventPayload> = {}): PointEventPayload {
  return {
    pointId: "estacao-central-plano-piloto",
    pointName: "Estação Central — Plano Piloto",
    categoryKey: "metro",
    assetId: "tela-01",
    source: "qr",
    utm: { utm_source: "flyer", utm_medium: "print" },
    deviceCategory: "mobile",
    os: "Android",
    browser: "Chrome",
    language: "pt-BR",
    viewport: "390x844",
    screen: "390x844",
    timezone: "America/Sao_Paulo",
    referrer: "https://www.google.com/",
    visitorId: "11111111-1111-1111-1111-111111111111",
    sessionId: "22222222-2222-2222-2222-222222222222",
    isFirstVisit: true,
    event: "point_profile_view",
    timestamp: "2026-09-17T12:00:00.000Z",
    scrollDepthPercent: undefined,
    msSincePageLoad: 1234,
    ...overrides,
  };
}

function funnelPayload(overrides: Partial<FunnelEventPayload> = {}): FunnelEventPayload {
  return {
    deviceCategory: "mobile",
    os: "iOS",
    browser: "Safari",
    language: "pt-BR",
    viewport: "390x844",
    screen: "390x844",
    timezone: "America/Sao_Paulo",
    referrer: undefined,
    visitorId: "33333333-3333-3333-3333-333333333333",
    sessionId: "44444444-4444-4444-4444-444444444444",
    isFirstVisit: false,
    source: "qr",
    initialPointSlug: "estacao-central-plano-piloto",
    qrId: undefined,
    firstTouchAt: "2026-09-17T11:55:00.000Z",
    landingPath: "/ponto/estacao-central-plano-piloto?src=qr",
    event: "planner_start",
    timestamp: "2026-09-17T12:05:00.000Z",
    anonymousSessionId: "44444444-4444-4444-4444-444444444444",
    currentPath: "/planejador",
    pointSlug: undefined,
    pointName: undefined,
    categoryKey: undefined,
    mediaType: undefined,
    planningIntent: "dooh",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// mapPointEventToRow
// ---------------------------------------------------------------------------

test("mapPointEventToRow: evento de ponto vira registro correto com event_domain 'point'", () => {
  const row = mapPointEventToRow(pointPayload(), { countryCode: "BR" });

  assert.equal(row.event_name, "point_profile_view");
  assert.equal(row.event_domain, "point");
  assert.equal(row.visitor_id, "11111111-1111-1111-1111-111111111111");
  assert.equal(row.session_id, "22222222-2222-2222-2222-222222222222");
  assert.equal(row.point_slug, "estacao-central-plano-piloto");
  assert.equal(row.category_key, "metro");
  assert.equal(row.source, "qr");
  assert.equal(row.country_code, "BR");
});

test("mapPointEventToRow: device/browser/OS/idioma/timezone preservados", () => {
  const row = mapPointEventToRow(pointPayload());

  assert.equal(row.device_type, "mobile");
  assert.equal(row.os, "Android");
  assert.equal(row.browser, "Chrome");
  assert.equal(row.language, "pt-BR");
  assert.equal(row.timezone, "America/Sao_Paulo");
  assert.equal(row.viewport_width, 390);
  assert.equal(row.viewport_height, 844);
  assert.equal(row.screen_width, 390);
  assert.equal(row.screen_height, 844);
  assert.equal(row.referrer, "https://www.google.com/");
});

test("mapPointEventToRow: UTM preservado quando presente no payload", () => {
  const row = mapPointEventToRow(pointPayload());

  assert.equal(row.utm_source, "flyer");
  assert.equal(row.utm_medium, "print");
  assert.equal(row.utm_campaign, null);
});

test("mapPointEventToRow: sem UTM no payload, colunas de UTM ficam null (nunca inventadas)", () => {
  const row = mapPointEventToRow(pointPayload({ utm: undefined }));

  assert.equal(row.utm_source, null);
  assert.equal(row.utm_medium, null);
  assert.equal(row.utm_campaign, null);
  assert.equal(row.utm_term, null);
  assert.equal(row.utm_content, null);
});

test("mapPointEventToRow: campos ausentes (os/browser/referrer/scroll) ficam null, não undefined/inventados", () => {
  const row = mapPointEventToRow(
    pointPayload({
      os: undefined,
      browser: undefined,
      referrer: undefined,
      language: undefined,
      timezone: undefined,
      viewport: undefined,
      screen: undefined,
      scrollDepthPercent: undefined,
      assetId: undefined,
      source: undefined,
    }),
  );

  assert.equal(row.os, null);
  assert.equal(row.browser, null);
  assert.equal(row.referrer, null);
  assert.equal(row.language, null);
  assert.equal(row.timezone, null);
  assert.equal(row.viewport_width, null);
  assert.equal(row.viewport_height, null);
  assert.equal(row.screen_width, null);
  assert.equal(row.screen_height, null);
  assert.equal(row.scroll_depth_percent, null);
  assert.equal(row.source, null);
  // conceitos que só existem no domínio de funil nunca são inventados aqui
  assert.equal(row.initial_point_slug, null);
  assert.equal(row.qr_id, null);
  assert.equal(row.landing_path, null);
  assert.equal(row.media_type, null);
  assert.equal(row.planning_intent, null);
});

test("mapPointEventToRow: scroll depth é clampado em [0,100] e arredondado", () => {
  assert.equal(
    mapPointEventToRow(pointPayload({ scrollDepthPercent: 62.7 })).scroll_depth_percent,
    63,
  );
  assert.equal(
    mapPointEventToRow(pointPayload({ scrollDepthPercent: -5 })).scroll_depth_percent,
    0,
  );
  assert.equal(
    mapPointEventToRow(pointPayload({ scrollDepthPercent: 140 })).scroll_depth_percent,
    100,
  );
});

test("mapPointEventToRow: sem country code (fora de borda Cloudflare), fica null — nunca inventado", () => {
  const row = mapPointEventToRow(pointPayload());
  assert.equal(row.country_code, null);
});

// ---------------------------------------------------------------------------
// mapFunnelEventToRow
// ---------------------------------------------------------------------------

test("mapFunnelEventToRow: evento de funil vira registro correto com event_domain 'funnel'", () => {
  const row = mapFunnelEventToRow(funnelPayload(), { countryCode: "BR" });

  assert.equal(row.event_name, "planner_start");
  assert.equal(row.event_domain, "funnel");
  assert.equal(row.visitor_id, "33333333-3333-3333-3333-333333333333");
  assert.equal(row.session_id, "44444444-4444-4444-4444-444444444444");
  assert.equal(row.initial_point_slug, "estacao-central-plano-piloto");
  assert.equal(row.landing_path, "/ponto/estacao-central-plano-piloto?src=qr");
  assert.equal(row.source, "qr");
  assert.equal(row.planning_intent, "dooh");
  assert.equal(row.country_code, "BR");
});

test("mapFunnelEventToRow: session_id vem do anonymousSessionId (identidade declarada da jornada)", () => {
  const row = mapFunnelEventToRow(
    funnelPayload({ anonymousSessionId: "session-do-funil", sessionId: "outro-id-improvavel" }),
  );
  assert.equal(row.session_id, "session-do-funil");
});

test("mapFunnelEventToRow: pointSlug/mediaType preservados quando presentes (planner_point_add / planner_media_select)", () => {
  const row = mapFunnelEventToRow(
    funnelPayload({
      event: "planner_media_select",
      pointSlug: "estacao-central-plano-piloto",
      pointName: "Estação Central",
      categoryKey: "metro",
      mediaType: "panel_led",
    }),
  );

  assert.equal(row.point_slug, "estacao-central-plano-piloto");
  assert.equal(row.category_key, "metro");
  assert.equal(row.media_type, "panel_led");
});

test("mapFunnelEventToRow: eventos de funil nunca carregam UTM hoje — colunas ficam null, não inventadas", () => {
  const row = mapFunnelEventToRow(funnelPayload());
  assert.equal(row.utm_source, null);
  assert.equal(row.utm_medium, null);
  assert.equal(row.utm_campaign, null);
  assert.equal(row.utm_term, null);
  assert.equal(row.utm_content, null);
});

test("mapFunnelEventToRow: scroll_depth_percent é sempre null (não existe nesse domínio)", () => {
  assert.equal(mapFunnelEventToRow(funnelPayload()).scroll_depth_percent, null);
});

test("mapFunnelEventToRow: campos opcionais ausentes (qrId/pointSlug/categoryKey) ficam null", () => {
  const row = mapFunnelEventToRow(
    funnelPayload({
      qrId: undefined,
      pointSlug: undefined,
      categoryKey: undefined,
      mediaType: undefined,
    }),
  );
  assert.equal(row.qr_id, null);
  assert.equal(row.point_slug, null);
  assert.equal(row.category_key, null);
  assert.equal(row.media_type, null);
});

// ---------------------------------------------------------------------------
// Privacidade / minimização — não há PII, IP bruto ou user-agent bruto em
// nenhuma linha gerada, em nenhum dos dois mapeadores.
// ---------------------------------------------------------------------------

const FORBIDDEN_KEYS = ["ip", "userAgent", "user_agent", "nome", "email", "telefone", "contato"];

test("mapPointEventToRow: nenhuma chave de PII/IP/user-agent bruto aparece na linha (nem em metadata)", () => {
  const row = mapPointEventToRow(pointPayload());
  const serialized = JSON.stringify(row).toLowerCase();
  for (const key of FORBIDDEN_KEYS) {
    assert.equal(
      serialized.includes(`"${key.toLowerCase()}"`),
      false,
      `chave proibida encontrada: ${key}`,
    );
  }
});

test("mapFunnelEventToRow: nenhuma chave de PII/IP/user-agent bruto aparece na linha (nem em metadata)", () => {
  const row = mapFunnelEventToRow(funnelPayload());
  const serialized = JSON.stringify(row).toLowerCase();
  for (const key of FORBIDDEN_KEYS) {
    assert.equal(
      serialized.includes(`"${key.toLowerCase()}"`),
      false,
      `chave proibida encontrada: ${key}`,
    );
  }
});

test("mapPointEventToRow: metadata só contém os campos conhecidos esperados, nada além disso", () => {
  const row = mapPointEventToRow(pointPayload());
  const metadata = row.metadata as Record<string, unknown>;
  const allowedKeys = new Set([
    "pointName",
    "assetId",
    "isFirstVisit",
    "msSincePageLoad",
    "clientTimestamp",
  ]);
  for (const key of Object.keys(metadata)) {
    assert.ok(allowedKeys.has(key), `chave inesperada em metadata: ${key}`);
  }
});

test("metadata: payload absurdamente grande é cortado, não aceito como está (cinto de segurança)", () => {
  const row = mapPointEventToRow(pointPayload({ pointName: "x".repeat(50_000) }));
  const serialized = JSON.stringify(row.metadata);
  assert.ok(serialized.length < 5000, "metadata deveria ter sido truncada");
  assert.equal((row.metadata as Record<string, unknown>)._truncated, true);
});

test("textos longos (referrer/landing_path/etc.) são cortados a um tamanho razoável, nunca armazenados sem limite", () => {
  const hugeReferrer = "https://example.com/" + "a".repeat(5000);
  const row = mapPointEventToRow(pointPayload({ referrer: hugeReferrer }));
  assert.ok(row.referrer != null && row.referrer.length <= 1000);
});

// ---------------------------------------------------------------------------
// insertAnalyticsEvent — nunca lança, sempre resolve, best-effort de verdade.
// ---------------------------------------------------------------------------

function fakeClient(
  insertImpl: (row: unknown) => Promise<{ error: { message: string; code: string } | null }>,
) {
  return {
    from() {
      return { insert: insertImpl };
    },
    // biome-ignore lint: cast simplificado só para o shape que insertAnalyticsEvent usa em teste
  } as never;
}

test("insertAnalyticsEvent: sem client configurado (Supabase indisponível/sem env), resolve ok:false sem lançar", async () => {
  const row = mapPointEventToRow(pointPayload());
  const result = await insertAnalyticsEvent(undefined, row);
  assert.deepEqual(result, { ok: false, reason: "supabase_not_configured" });
});

test("insertAnalyticsEvent: INSERT bem-sucedido retorna ok:true", async () => {
  const row = mapPointEventToRow(pointPayload());
  const client = fakeClient(async () => ({ error: null }));
  const result = await insertAnalyticsEvent(client, row);
  assert.deepEqual(result, { ok: true });
});

test("insertAnalyticsEvent: Supabase retorna erro (ex. RLS/rede) — tratado, não lança, ok:false", async () => {
  const row = mapPointEventToRow(pointPayload());
  const client = fakeClient(async () => ({
    error: { message: "permission denied", code: "42501" },
  }));
  const result = await insertAnalyticsEvent(client, row);
  assert.deepEqual(result, { ok: false, reason: "permission denied" });
});

test("insertAnalyticsEvent: client lança exceção (ex. Supabase fora do ar) — best-effort, nunca derruba a chamada", async () => {
  const row = mapPointEventToRow(pointPayload());
  const client = fakeClient(async () => {
    throw new Error("network unreachable");
  });
  const result = await insertAnalyticsEvent(client, row);
  assert.equal(result.ok, false);
});
