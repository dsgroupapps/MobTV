import type {
  AnalyticsReport,
  BreakdownEntry,
  DailyPoint,
  FunnelResult,
  PointPerformance,
} from "../reporting/types.ts";
import {
  escapeHtml,
  formatDateRange,
  formatNumber,
  formatPercentChange,
  formatRate,
} from "./format.ts";

/**
 * Renderiza `AnalyticsReport` (já pronto pelo Bloco B) em HTML de e-mail —
 * NENHUMA métrica é recalculada aqui, só formatada/tabelada. Se uma
 * definição mudar no Bloco B, este arquivo reflete automaticamente (lê
 * `report.overview`/`report.funnel`/etc. como estão).
 *
 * Compatível com clientes de e-mail: sem JS, sem CSS externo/fontes
 * externas, sem componentes React — só HTML + CSS inline, tabelas para
 * layout (o mínimo comum denominador que sobrevive a Outlook/Gmail/Apple
 * Mail).
 */

const COLORS = {
  navy: "#0f1f3d",
  offWhite: "#f4f5f7",
  text: "#1a1a1a",
  muted: "#6b7280",
  border: "#e2e4e9",
  positive: "#0f7a4a",
  negative: "#b3261e",
};

function section(title: string, bodyHtml: string): string {
  return `
    <tr>
      <td style="padding:24px 24px 4px 24px;">
        <h2 style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${COLORS.navy};letter-spacing:0.02em;text-transform:uppercase;">${escapeHtml(title)}</h2>
        ${bodyHtml}
      </td>
    </tr>
  `;
}

function emptyState(message: string): string {
  return `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${COLORS.muted};">${escapeHtml(message)}</p>`;
}

function table(headers: string[], rows: string[][]): string {
  const th = headers
    .map(
      (h) =>
        `<th align="left" style="border-bottom:2px solid ${COLORS.border};padding:6px 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${COLORS.muted};text-transform:uppercase;">${escapeHtml(h)}</th>`,
    )
    .join("");
  const tr = rows
    .map(
      (cells) =>
        `<tr>${cells
          .map(
            (cell) =>
              `<td style="border-bottom:1px solid ${COLORS.border};padding:6px 10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${COLORS.text};">${cell}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

// ---------------------------------------------------------------------------
// Visão geral
// ---------------------------------------------------------------------------

function overviewMetric(label: string, value: number, changePercent?: number | null): string {
  const changeHtml =
    changePercent === undefined
      ? ""
      : `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${
          changePercent === null
            ? COLORS.muted
            : changePercent >= 0
              ? COLORS.positive
              : COLORS.negative
        };margin-top:2px;">${escapeHtml(formatPercentChange(changePercent))} vs. período anterior</div>`;
  return `
    <td style="padding:8px 16px 8px 0;vertical-align:top;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:${COLORS.navy};">${escapeHtml(formatNumber(value))}</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${COLORS.muted};">${escapeHtml(label)}</div>
      ${changeHtml}
    </td>
  `;
}

function renderOverview(report: AnalyticsReport): string {
  const plannerStart = report.funnel.steps.find((s) => s.event === "planner_start");
  const plannerSubmit = report.funnel.steps.find((s) => s.event === "planner_submit");
  const cmp = report.comparison;

  const cells = [
    overviewMetric(
      "Visualizações de pontos",
      report.overview.pointViews,
      cmp?.pointViews.percentChange,
    ),
    overviewMetric(
      "Visitantes identificados",
      report.overview.visitors,
      cmp?.visitors.percentChange,
    ),
    overviewMetric("Sessões", report.overview.sessions, cmp?.sessions.percentChange),
    overviewMetric("QR landings", report.overview.qrLandings, cmp?.qrLandings.percentChange),
    // Planner starts/submits vêm do funil geral (Bloco B não calcula
    // comparação de período anterior para essas duas métricas — por isso
    // não mostramos variação aqui, nunca inventada).
    overviewMetric("Planner starts", plannerStart?.sessions ?? 0),
    overviewMetric("Solicitações de proposta", plannerSubmit?.sessions ?? 0),
  ];

  const rowsOf3 = [cells.slice(0, 3), cells.slice(3, 6)];
  const tableRows = rowsOf3.map((row) => `<tr>${row.join("")}</tr>`).join("");

  const comparisonNote = cmp
    ? `<p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${COLORS.muted};">Comparado ao período de ${escapeHtml(formatDateRange(cmp.previousRange))}.</p>`
    : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${tableRows}</table>${comparisonNote}`;
}

// ---------------------------------------------------------------------------
// Funil
// ---------------------------------------------------------------------------

function renderFunnel(funnel: FunnelResult, emptyMessage: string): string {
  if (funnel.totalSessions === 0) return emptyState(emptyMessage);
  const rows = funnel.steps.map((step) => [
    escapeHtml(step.label),
    escapeHtml(formatNumber(step.sessions)),
    escapeHtml(formatRate(step.pctOfFirstStep)),
    escapeHtml(formatRate(step.pctOfPreviousStep)),
  ]);
  return table(["Etapa", "Sessões", "% do início", "% da etapa anterior"], rows);
}

// ---------------------------------------------------------------------------
// Pontos
// ---------------------------------------------------------------------------

const TOP_POINTS_IN_EMAIL = 10;

function renderPoints(points: PointPerformance[]): string {
  if (points.length === 0) return emptyState("Nenhum ponto com atividade no período.");

  const top = points.slice(0, TOP_POINTS_IN_EMAIL);
  const rows = top.map((p) => [
    escapeHtml(p.pointSlug),
    escapeHtml(formatNumber(p.qrLandings)),
    escapeHtml(formatNumber(p.sessions)),
    escapeHtml(formatNumber(p.visitors)),
    escapeHtml(formatNumber(p.pointViews)),
    escapeHtml(formatNumber(p.plannerStart)),
    escapeHtml(formatNumber(p.plannerSubmit)),
    escapeHtml(formatRate(p.qrToPlannerRate)),
    escapeHtml(formatRate(p.qrToSubmitRate)),
  ]);

  const tableHtml = table(
    [
      "Ponto",
      "QR landings",
      "Sessões",
      "Visitantes",
      "Point views",
      "Planner starts",
      "Propostas",
      "QR→Planner",
      "QR→Proposta",
    ],
    rows,
  );

  const note =
    points.length > TOP_POINTS_IN_EMAIL
      ? `<p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${COLORS.muted};">Mostrando os ${TOP_POINTS_IN_EMAIL} pontos com mais QR landings, de ${escapeHtml(formatNumber(points.length))} pontos com atividade no período. Lista completa no CSV anexo.</p>`
      : "";

  return `${tableHtml}${note}`;
}

// ---------------------------------------------------------------------------
// Breakdowns (devices/OS/browsers/origem)
// ---------------------------------------------------------------------------

const UNKNOWN_LABEL = "Não identificado";

function breakdownLabel(value: string): string {
  return value === "unknown" ? UNKNOWN_LABEL : value;
}

/** Só renderiza a tabela se houver pelo menos um valor conhecido (nunca uma tabela só com "unknown"/vazia). */
function renderBreakdown(entries: BreakdownEntry[], valueHeader: string): string | null {
  const hasKnownData = entries.some((e) => e.value !== "unknown" && e.sessions > 0);
  if (!hasKnownData) return null;

  const rows = entries
    .filter((e) => e.sessions > 0)
    .map((e) => [
      escapeHtml(breakdownLabel(e.value)),
      escapeHtml(formatNumber(e.sessions)),
      escapeHtml(formatRate(e.pct)),
    ]);
  return table([valueHeader, "Sessões", "%"], rows);
}

function renderDevicesSection(report: AnalyticsReport): string {
  const blocks = [
    { title: "Dispositivos", html: renderBreakdown(report.devices, "Dispositivo") },
    { title: "Sistemas operacionais", html: renderBreakdown(report.operatingSystems, "SO") },
    { title: "Navegadores", html: renderBreakdown(report.browsers, "Navegador") },
  ].filter((b): b is { title: string; html: string } => b.html !== null);

  if (blocks.length === 0) return emptyState("Sem dados de dispositivo/SO/navegador no período.");

  return blocks
    .map(
      (b) =>
        `<h3 style="margin:12px 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${COLORS.text};">${escapeHtml(b.title)}</h3>${b.html}`,
    )
    .join("");
}

function renderOriginSection(report: AnalyticsReport): string {
  const blocks = [
    { title: "Origem (source)", html: renderBreakdown(report.sources, "Source") },
    {
      title: "Ponto de origem (initial point)",
      html: renderBreakdown(report.initialPointSlugs, "Ponto"),
    },
    { title: "QR ID", html: renderBreakdown(report.qrIds, "QR ID") },
    { title: "UTM source", html: renderBreakdown(report.utmSources, "utm_source") },
    { title: "UTM medium", html: renderBreakdown(report.utmMediums, "utm_medium") },
    { title: "UTM campaign", html: renderBreakdown(report.utmCampaigns, "utm_campaign") },
  ].filter((b): b is { title: string; html: string } => b.html !== null);

  if (blocks.length === 0) {
    return emptyState(
      "Sem dados de origem/atribuição com valor conhecido no período (UTM hoje só é gravado em eventos de ponto — ver limitações do relatório).",
    );
  }

  return blocks
    .map(
      (b) =>
        `<h3 style="margin:12px 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${COLORS.text};">${escapeHtml(b.title)}</h3>${b.html}`,
    )
    .join("");
}

// ---------------------------------------------------------------------------
// Evolução diária
// ---------------------------------------------------------------------------

function renderDaily(daily: DailyPoint[]): string {
  if (daily.length === 0)
    return emptyState("Sem eventos no período para montar a evolução diária.");
  const rows = daily.map((d) => [
    escapeHtml(d.date),
    escapeHtml(formatNumber(d.pointViews)),
    escapeHtml(formatNumber(d.qrLandings)),
    escapeHtml(formatNumber(d.plannerStarts)),
    escapeHtml(formatNumber(d.plannerSubmits)),
  ]);
  return table(["Data", "Visualizações", "QR landings", "Planner starts", "Propostas"], rows);
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

function renderInsights(report: AnalyticsReport): string {
  if (report.insights.length === 0) {
    return emptyState("Sem destaques com dados suficientes neste período.");
  }
  const items = report.insights
    .map(
      (insight) =>
        `<li style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${COLORS.text};margin-bottom:6px;">${escapeHtml(insight.text)}</li>`,
    )
    .join("");
  return `<ul style="margin:0;padding-left:18px;">${items}</ul>`;
}

// ---------------------------------------------------------------------------
// Documento completo
// ---------------------------------------------------------------------------

export function renderReportHtml(report: AnalyticsReport): string {
  const rangeLabel = formatDateRange(report.range);

  const body = [
    section("Visão geral", renderOverview(report)),
    section(
      "Funil QR (sessões originadas por QR)",
      renderFunnel(report.qrFunnel, "Nenhuma sessão iniciada por QR neste período."),
    ),
    section(
      "Funil geral (todas as sessões)",
      renderFunnel(report.funnel, "Nenhuma sessão no período."),
    ),
    section("Desempenho dos pontos", renderPoints(report.points)),
    section("Dispositivos, SO e navegadores", renderDevicesSection(report)),
    section("Origem", renderOriginSection(report)),
    section("Evolução diária", renderDaily(report.daily)),
    section("Destaques do período", renderInsights(report)),
  ].join("");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MOBTV Analytics — ${escapeHtml(rangeLabel)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.offWhite};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.offWhite};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:640px;width:100%;">
            <tr>
              <td style="background-color:${COLORS.navy};padding:24px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;color:#ffffff;font-weight:bold;">MOBTV Analytics</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#c9d2e3;margin-top:4px;">Relatório de ${escapeHtml(rangeLabel)}</div>
              </td>
            </tr>
            ${body}
            <tr>
              <td style="padding:16px 24px 24px 24px;border-top:1px solid ${COLORS.border};">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${COLORS.muted};">
                  Dados brutos do período em anexo (CSV). Eventos de teste/validação são excluídos deste relatório por padrão.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
