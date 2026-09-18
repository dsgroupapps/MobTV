import assert from "node:assert/strict";
import test from "node:test";

import { filterByRange, previousRange, compareOverview } from "./period.ts";
import { computeInsights } from "./insights.ts";
import { buildAnalyticsReport } from "./report.ts";
import { row, qrJourney } from "./fixtures.test-support.ts";
import type { AnalyticsReport } from "./types.ts";

test("filterByRange: [start,end) — start inclusive, end exclusivo", () => {
  const rows = [
    row({ id: "before", created_at: "2026-08-31T23:59:59.999Z" }),
    row({ id: "at-start", created_at: "2026-09-01T00:00:00.000Z" }),
    row({ id: "middle", created_at: "2026-09-04T00:00:00.000Z" }),
    row({ id: "at-end", created_at: "2026-09-08T00:00:00.000Z" }),
    row({ id: "after", created_at: "2026-09-08T00:00:00.001Z" }),
  ];

  const result = filterByRange(rows, {
    start: new Date("2026-09-01T00:00:00.000Z"),
    end: new Date("2026-09-08T00:00:00.000Z"),
  });

  assert.deepEqual(
    result.map((r) => r.id),
    ["at-start", "middle"],
    "at-start entra (inclusive), at-end fica de fora (exclusivo)",
  );
});

test("filterByRange: relatórios consecutivos não duplicam nem perdem o evento na fronteira", () => {
  const boundaryRow = row({ id: "boundary", created_at: "2026-09-08T00:00:00.000Z" });
  const week1 = filterByRange([boundaryRow], {
    start: new Date("2026-09-01T00:00:00.000Z"),
    end: new Date("2026-09-08T00:00:00.000Z"),
  });
  const week2 = filterByRange([boundaryRow], {
    start: new Date("2026-09-08T00:00:00.000Z"),
    end: new Date("2026-09-15T00:00:00.000Z"),
  });
  assert.equal(week1.length, 0, "boundary não pertence à semana que termina nele");
  assert.equal(week2.length, 1, "boundary pertence à semana que começa nele");
});

test("previousRange: mesma duração, imediatamente antes de start", () => {
  const range = {
    start: new Date("2026-09-08T00:00:00.000Z"),
    end: new Date("2026-09-15T00:00:00.000Z"),
  };
  const prev = previousRange(range);
  assert.equal(prev.start.toISOString(), "2026-09-01T00:00:00.000Z");
  assert.equal(prev.end.toISOString(), "2026-09-08T00:00:00.000Z");
});

test("compareOverview: diferença absoluta e percentual corretas", () => {
  const current = { events: 150, sessions: 100, visitors: 90, qrLandings: 40, pointViews: 80 };
  const previous = { events: 100, sessions: 80, visitors: 70, qrLandings: 20, pointViews: 60 };
  const cmp = compareOverview(current, previous);
  assert.equal(cmp.events.absoluteChange, 50);
  assert.equal(cmp.events.percentChange, 50);
  assert.equal(cmp.qrLandings.percentChange, 100);
});

test("compareOverview: previous === 0 nunca vira Infinity/NaN, vira null (mesmo com current > 0)", () => {
  const current = { events: 10, sessions: 5, visitors: 5, qrLandings: 3, pointViews: 4 };
  const previous = { events: 0, sessions: 0, visitors: 0, qrLandings: 0, pointViews: 0 };
  const cmp = compareOverview(current, previous);
  for (const metric of Object.values(cmp)) {
    assert.equal(metric.percentChange, null);
    assert.equal(Number.isFinite(metric.absoluteChange), true);
  }
});

test("compareOverview: 0 contra 0 também vira null (0/0 é indefinido, não 0%)", () => {
  const zero = { events: 0, sessions: 0, visitors: 0, qrLandings: 0, pointViews: 0 };
  const cmp = compareOverview(zero, zero);
  assert.equal(cmp.events.percentChange, null);
  assert.equal(cmp.events.absoluteChange, 0);
});

// ---------------------------------------------------------------------------
// insights
// ---------------------------------------------------------------------------

function emptyReport(overrides: Partial<AnalyticsReport> = {}): AnalyticsReport {
  return {
    range: { start: new Date(), end: new Date() },
    timezone: "America/Sao_Paulo",
    includeTestEvents: false,
    overview: { events: 0, sessions: 0, visitors: 0, qrLandings: 0, pointViews: 0 },
    funnel: { totalSessions: 0, steps: [] },
    qrFunnel: { totalSessions: 0, steps: [] },
    points: [],
    devices: [],
    operatingSystems: [],
    browsers: [],
    sources: [],
    initialPointSlugs: [],
    qrIds: [],
    utmSources: [],
    utmMediums: [],
    utmCampaigns: [],
    daily: [],
    comparison: null,
    insights: [],
    ...overrides,
  };
}

test("insights: sem nenhum dado, não inventa insight nenhum (lista vazia, não frases com 0%/undefined)", () => {
  assert.deepEqual(computeInsights(emptyReport()), []);
});

test("insights: frase factual, sem causalidade — ex. 'X representou Y% das sessões'", () => {
  const report = emptyReport({
    operatingSystems: [
      { value: "iOS", sessions: 61, pct: 61 },
      { value: "Android", sessions: 39, pct: 39 },
    ],
  });
  const insights = computeInsights(report);
  const osInsight = insights.find((i) => i.key === "top_os")!;
  assert.equal(osInsight.text, "iOS representou 61% das sessões no período.");
  assert.equal(
    /demonstr|prefer|gost|inten[çc][aã]o/i.test(osInsight.text),
    false,
    "nunca infere intenção/comportamento",
  );
});

test("insights: ignora entradas 'unknown' ao escolher o predominante", () => {
  const report = emptyReport({
    devices: [
      { value: "unknown", sessions: 100, pct: 80 },
      { value: "mobile", sessions: 20, pct: 20 },
    ],
  });
  const deviceInsight = computeInsights(report).find((i) => i.key === "top_device");
  assert.equal(deviceInsight?.text.startsWith("mobile"), true);
});

// ---------------------------------------------------------------------------
// integração: buildAnalyticsReport
// ---------------------------------------------------------------------------

test("buildAnalyticsReport: integração ponta a ponta com uma jornada real e comparação de período", () => {
  const currentRows = qrJourney({
    sessionId: "s1",
    pointSlug: "hospital-do-gama",
    createdAtBase: Date.parse("2026-09-10T12:00:00.000Z"),
  });
  const previousRows = qrJourney({
    sessionId: "s0",
    pointSlug: "hospital-do-gama",
    createdAtBase: Date.parse("2026-09-03T12:00:00.000Z"),
  });

  const report = buildAnalyticsReport(currentRows, {
    start: new Date("2026-09-08T00:00:00.000Z"),
    end: new Date("2026-09-15T00:00:00.000Z"),
    timezone: "America/Sao_Paulo",
    previousRows,
  });

  assert.equal(report.overview.qrLandings, 1);
  assert.equal(report.overview.pointViews, 1);
  assert.equal(report.funnel.steps.find((s) => s.event === "planner_submit")!.sessions, 1);
  assert.equal(report.points[0].pointSlug, "hospital-do-gama");
  assert.ok(report.comparison, "comparação existe quando previousRows é informado");
  assert.equal(report.comparison!.qrLandings.current, 1);
  assert.equal(report.comparison!.qrLandings.previous, 1);
  assert.equal(report.comparison!.qrLandings.percentChange, 0);
});

test("buildAnalyticsReport: sem previousRows, comparison é null (nunca inventa comparação)", () => {
  const report = buildAnalyticsReport([], {
    start: new Date("2026-09-08T00:00:00.000Z"),
    end: new Date("2026-09-15T00:00:00.000Z"),
  });
  assert.equal(report.comparison, null);
});

test("buildAnalyticsReport: exclui eventos de teste por padrão, mas includeTestEvents:true os traz de volta", () => {
  const rows = [
    ...qrJourney({
      sessionId: "s-real",
      pointSlug: "p1",
      createdAtBase: Date.parse("2026-09-10T12:00:00.000Z"),
    }),
    row({
      session_id: "s-test",
      source: "analytics_block_a_validation",
      event_name: "qr_landing",
      created_at: "2026-09-10T12:00:00.000Z",
    }),
  ];

  const withoutTest = buildAnalyticsReport(rows, {
    start: new Date("2026-09-08T00:00:00.000Z"),
    end: new Date("2026-09-15T00:00:00.000Z"),
  });
  const withTest = buildAnalyticsReport(rows, {
    start: new Date("2026-09-08T00:00:00.000Z"),
    end: new Date("2026-09-15T00:00:00.000Z"),
    includeTestEvents: true,
  });

  assert.equal(withoutTest.overview.qrLandings, 1, "evento de teste não conta por padrão");
  assert.equal(withTest.overview.qrLandings, 2, "com includeTestEvents:true, conta");
});

test("buildAnalyticsReport: nenhuma métrica numérica no relatório é NaN/Infinity, mesmo com dado mínimo", () => {
  const report = buildAnalyticsReport([row({ event_name: "qr_landing" })], {
    start: new Date("2020-01-01T00:00:00.000Z"),
    end: new Date("2030-01-01T00:00:00.000Z"),
  });

  function assertFiniteDeep(value: unknown, path: string): void {
    if (typeof value === "number") {
      assert.equal(Number.isFinite(value), true, `${path} não é finito: ${value}`);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v, i) => assertFiniteDeep(v, `${path}[${i}]`));
      return;
    }
    if (value && typeof value === "object" && !(value instanceof Date)) {
      for (const [key, v] of Object.entries(value)) assertFiniteDeep(v, `${path}.${key}`);
    }
  }

  assertFiniteDeep(report, "report");
});
