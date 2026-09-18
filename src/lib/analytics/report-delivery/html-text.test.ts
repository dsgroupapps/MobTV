import assert from "node:assert/strict";
import test from "node:test";

import { renderReportHtml } from "./html.ts";
import { renderReportText } from "./text.ts";
import { escapeHtml } from "./format.ts";
import { buildAnalyticsReport } from "../reporting/report.ts";
import { row, qrJourney } from "../reporting/fixtures.test-support.ts";

const RANGE = {
  start: new Date("2026-09-08T00:00:00.000Z"),
  end: new Date("2026-09-15T00:00:00.000Z"),
};

function emptyReport() {
  return buildAnalyticsReport([], RANGE);
}

function reportWithData() {
  const rows = [
    ...qrJourney({
      sessionId: "s1",
      pointSlug: "hospital-do-gama",
      createdAtBase: Date.parse("2026-09-09T12:00:00.000Z"),
    }),
    ...qrJourney({
      sessionId: "s2",
      pointSlug: "hospital-do-gama",
      createdAtBase: Date.parse("2026-09-10T12:00:00.000Z"),
      upToStep: 2,
    }),
    ...qrJourney({
      sessionId: "s3",
      pointSlug: "estacao-central",
      createdAtBase: Date.parse("2026-09-11T12:00:00.000Z"),
      device: { device_type: "desktop", os: "Windows", browser: "Edge" },
    }),
  ];
  const previousRows = qrJourney({
    sessionId: "s0",
    pointSlug: "hospital-do-gama",
    createdAtBase: Date.parse("2026-09-02T12:00:00.000Z"),
  });
  return buildAnalyticsReport(rows, { ...RANGE, previousRows });
}

// ---------------------------------------------------------------------------
// relatório vazio
// ---------------------------------------------------------------------------

test("HTML: relatório vazio renderiza sem lançar, com estados vazios (não NaN/Infinity/undefined)", () => {
  const html = renderReportHtml(emptyReport());
  assert.equal(typeof html, "string");
  assert.ok(html.includes("MOBTV Analytics"));
  assert.equal(/NaN|Infinity|undefined/.test(html), false);
  assert.ok(html.includes("Nenhuma sessão iniciada por QR neste período."));
  assert.ok(html.includes("Nenhum ponto com atividade no período."));
  assert.ok(html.includes("Sem destaques com dados suficientes neste período."));
});

test("texto: relatório vazio renderiza sem lançar, sem NaN/Infinity/undefined", () => {
  const text = renderReportText(emptyReport());
  assert.equal(typeof text, "string");
  assert.equal(/NaN|Infinity|undefined/.test(text), false);
  assert.ok(text.includes("MOBTV ANALYTICS"));
});

// ---------------------------------------------------------------------------
// relatório com dados
// ---------------------------------------------------------------------------

test("HTML: overview renderizado com os números corretos do report (não recalculados)", () => {
  const report = reportWithData();
  const html = renderReportHtml(report);
  assert.ok(html.includes(String(report.overview.qrLandings)));
  assert.ok(html.includes("Visitantes identificados"));
  assert.ok(html.includes("Visualizações de pontos"));
});

test("HTML: funil QR e funil geral aparecem rotulados de forma distinguível", () => {
  const html = renderReportHtml(reportWithData());
  assert.ok(html.includes("Funil QR"));
  assert.ok(html.includes("Funil geral"));
  assert.ok(html.includes("sessões originadas por QR"));
  assert.ok(html.includes("todas as sessões"));
});

test("HTML: etapas do funil (labels) aparecem na tabela", () => {
  const report = reportWithData();
  const html = renderReportHtml(report);
  for (const step of report.qrFunnel.steps) {
    assert.ok(html.includes(step.label), `label "${step.label}" ausente do HTML`);
  }
});

test("HTML: pontos aparecem ordenados por QR landings desc, com slug (não nome inventado)", () => {
  const report = reportWithData();
  const html = renderReportHtml(report);
  assert.ok(html.includes("hospital-do-gama"));
  assert.ok(html.includes("estacao-central"));
  const idxHospital = html.indexOf("hospital-do-gama");
  const idxEstacao = html.indexOf("estacao-central");
  assert.ok(idxHospital < idxEstacao, "hospital-do-gama (mais QR landings) aparece antes");
});

test("HTML: dispositivos/OS/browsers aparecem quando há dado conhecido", () => {
  const html = renderReportHtml(reportWithData());
  assert.ok(html.includes("Dispositivos"));
  assert.ok(html.includes("mobile") || html.includes("desktop"));
  assert.ok(html.includes("Windows") || html.includes("Android"));
  assert.ok(html.includes("Edge") || html.includes("Chrome"));
});

test("HTML: comparação com período anterior aparece quando o report tem comparison", () => {
  const report = reportWithData();
  assert.ok(report.comparison, "fixture deveria ter comparison");
  const html = renderReportHtml(report);
  assert.ok(html.includes("vs. período anterior"));
});

test("HTML: insights determinísticos do Bloco B aparecem sem reescrita de conteúdo (só HTML-escapados, texto preservado)", () => {
  const report = reportWithData();
  const html = renderReportHtml(report);
  for (const insight of report.insights) {
    assert.ok(
      html.includes(escapeHtml(insight.text)),
      `insight "${insight.text}" ausente (esperado escapado via escapeHtml)`,
    );
  }
});

test("HTML: nenhum NaN/Infinity/undefined em um relatório com dados reais", () => {
  const html = renderReportHtml(reportWithData());
  assert.equal(/NaN|Infinity|undefined/.test(html), false);
});

test("texto: números principais e funil QR aparecem, sem NaN/Infinity", () => {
  const report = reportWithData();
  const text = renderReportText(report);
  assert.ok(text.includes(String(report.overview.qrLandings)));
  assert.ok(text.includes("FUNIL QR"));
  assert.equal(/NaN|Infinity|undefined/.test(text), false);
});

// ---------------------------------------------------------------------------
// escaping HTML
// ---------------------------------------------------------------------------

test("HTML: escapa point_slug malicioso que chega via initial_point_slug (funil/pontos/insights)", () => {
  const maliciousSlug = "<script>alert(1)</script>";
  const maliciousRows = [
    row({
      event_domain: "funnel",
      event_name: "qr_landing",
      session_id: "s-evil",
      visitor_id: "v-evil",
      source: "qr",
      initial_point_slug: maliciousSlug,
      point_slug: maliciousSlug,
      created_at: "2026-09-09T12:00:00.000Z",
    }),
  ];
  const report = buildAnalyticsReport(maliciousRows, RANGE);
  assert.equal(
    report.points[0]?.pointSlug,
    maliciousSlug,
    "o dado bruto no report NÃO é escapado — escaping é responsabilidade só do html.ts",
  );

  const html = renderReportHtml(report);
  assert.equal(
    html.includes("<script>alert(1)</script>"),
    false,
    "tag <script> crua não pode aparecer no HTML",
  );
  assert.ok(
    html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"),
    "valor malicioso aparece escapado",
  );
});

test("HTML: escapa valor malicioso em breakdown de UTM (utm_source de evento de ponto)", () => {
  const maliciousUtm = '"><img src=x onerror=alert(1)>';
  const maliciousRows = [
    row({
      event_domain: "point",
      session_id: "s-evil-2",
      visitor_id: "v-evil-2",
      utm_source: maliciousUtm,
      created_at: "2026-09-09T12:00:00.000Z",
    }),
  ];
  const report = buildAnalyticsReport(maliciousRows, RANGE);
  const html = renderReportHtml(report);
  assert.equal(
    html.includes("<img src=x onerror=alert(1)>"),
    false,
    "tag <img> crua não pode aparecer",
  );
  assert.ok(html.includes("&lt;img"), "valor malicioso aparece escapado");
});
