import assert from "node:assert/strict";
import test from "node:test";

import { generateAnalyticsReportPackage } from "./package.ts";
import { createInMemoryAnalyticsEventsRepository } from "../reporting/repository.ts";
import { qrJourney, row } from "../reporting/fixtures.test-support.ts";

const RANGE = {
  start: new Date("2026-09-08T00:00:00.000Z"),
  end: new Date("2026-09-15T00:00:00.000Z"),
};

test("generateAnalyticsReportPackage: dry-run com dados vazios — não lança, devolve tudo consistente", async () => {
  const repository = createInMemoryAnalyticsEventsRepository([]);
  const pkg = await generateAnalyticsReportPackage({ repository, ...RANGE });

  assert.equal(pkg.report.overview.events, 0);
  assert.ok(pkg.html.includes("MOBTV Analytics"));
  assert.ok(pkg.text.includes("MOBTV ANALYTICS"));
  assert.equal(pkg.filename, "mobtv-analytics-2026-09-08_2026-09-15.csv");
  assert.ok(pkg.csv.length > 0, "CSV sempre tem ao menos o header");
  assert.equal(pkg.csvBytes, Buffer.byteLength(pkg.csv, "utf8"));
});

test("generateAnalyticsReportPackage: NÃO chama fetch/Resend — é só geração (dry-run real)", async () => {
  let fetchCalled = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    fetchCalled = true;
    throw new Error("fetch não deveria ser chamado pelo dry-run");
  }) as typeof fetch;

  try {
    const repository = createInMemoryAnalyticsEventsRepository(
      qrJourney({
        sessionId: "s1",
        pointSlug: "p1",
        createdAtBase: Date.parse("2026-09-10T12:00:00.000Z"),
      }),
    );
    await generateAnalyticsReportPackage({ repository, ...RANGE });
    assert.equal(fetchCalled, false, "generateAnalyticsReportPackage não deve tocar rede/Resend");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("generateAnalyticsReportPackage: eventos de teste excluídos por padrão do report E do CSV", async () => {
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
  const repository = createInMemoryAnalyticsEventsRepository(rows);
  const pkg = await generateAnalyticsReportPackage({ repository, ...RANGE });

  assert.equal(pkg.report.overview.qrLandings, 1, "evento de teste não conta no report");
  assert.equal(pkg.csv.includes("s-test"), false, "evento de teste não aparece no CSV");
});

test("generateAnalyticsReportPackage: includeTestEvents:true traz o evento de teste de volta no report e no CSV", async () => {
  const rows = [
    row({
      session_id: "s-test",
      visitor_id: "v-test",
      source: "analytics_block_a_validation",
      event_name: "qr_landing",
      created_at: "2026-09-10T12:00:00.000Z",
    }),
  ];
  const repository = createInMemoryAnalyticsEventsRepository(rows);
  const pkg = await generateAnalyticsReportPackage({
    repository,
    ...RANGE,
    includeTestEvents: true,
  });

  assert.equal(pkg.report.overview.qrLandings, 1);
  assert.ok(pkg.csv.includes("s-test"));
});

test("generateAnalyticsReportPackage: gera comparação com período anterior automaticamente (busca as duas janelas)", async () => {
  const rows = [
    ...qrJourney({
      sessionId: "s1",
      pointSlug: "p1",
      createdAtBase: Date.parse("2026-09-10T12:00:00.000Z"),
    }),
    ...qrJourney({
      sessionId: "s0",
      pointSlug: "p1",
      createdAtBase: Date.parse("2026-09-03T12:00:00.000Z"),
    }), // período anterior
  ];
  const repository = createInMemoryAnalyticsEventsRepository(rows);
  const pkg = await generateAnalyticsReportPackage({ repository, ...RANGE });

  assert.ok(
    pkg.report.comparison,
    "comparação deveria existir (repository tem linhas do período anterior)",
  );
  assert.equal(pkg.report.comparison!.qrLandings.current, 1);
  assert.equal(pkg.report.comparison!.qrLandings.previous, 1);
});
