import type { AnalyticsReport } from "../reporting/types.ts";
import { formatDateRange, formatNumber, formatPercentChange, formatRate } from "./format.ts";

/**
 * Resumo em text/plain, para clientes que não renderizam HTML. Não
 * reproduz as tabelas completas (pontos/breakdowns) — só os números
 * principais, o topo do funil QR e os destaques, todos lidos direto de
 * `AnalyticsReport` sem recálculo.
 */
export function renderReportText(report: AnalyticsReport): string {
  const lines: string[] = [];
  const cmp = report.comparison;

  lines.push("MOBTV ANALYTICS");
  lines.push(`Relatório de ${formatDateRange(report.range)}`);
  lines.push("");
  lines.push("VISÃO GERAL");
  lines.push(
    `Visualizações de pontos: ${formatNumber(report.overview.pointViews)}${
      cmp ? ` (${formatPercentChange(cmp.pointViews.percentChange)} vs. período anterior)` : ""
    }`,
  );
  lines.push(
    `Visitantes identificados: ${formatNumber(report.overview.visitors)}${
      cmp ? ` (${formatPercentChange(cmp.visitors.percentChange)} vs. período anterior)` : ""
    }`,
  );
  lines.push(
    `Sessões: ${formatNumber(report.overview.sessions)}${
      cmp ? ` (${formatPercentChange(cmp.sessions.percentChange)} vs. período anterior)` : ""
    }`,
  );
  lines.push(
    `QR landings: ${formatNumber(report.overview.qrLandings)}${
      cmp ? ` (${formatPercentChange(cmp.qrLandings.percentChange)} vs. período anterior)` : ""
    }`,
  );
  const plannerStart = report.funnel.steps.find((s) => s.event === "planner_start");
  const plannerSubmit = report.funnel.steps.find((s) => s.event === "planner_submit");
  lines.push(`Planner starts: ${formatNumber(plannerStart?.sessions ?? 0)}`);
  lines.push(`Solicitações de proposta: ${formatNumber(plannerSubmit?.sessions ?? 0)}`);
  lines.push("");

  lines.push("FUNIL QR (sessões originadas por QR)");
  if (report.qrFunnel.totalSessions === 0) {
    lines.push("Nenhuma sessão iniciada por QR neste período.");
  } else {
    for (const step of report.qrFunnel.steps) {
      lines.push(
        `- ${step.label}: ${formatNumber(step.sessions)} sessões (${formatRate(step.pctOfFirstStep)} do início, ${formatRate(step.pctOfPreviousStep)} da etapa anterior)`,
      );
    }
  }
  lines.push("");

  lines.push(`DESEMPENHO DOS PONTOS (top ${Math.min(5, report.points.length)} por QR landings)`);
  if (report.points.length === 0) {
    lines.push("Nenhum ponto com atividade no período.");
  } else {
    for (const point of report.points.slice(0, 5)) {
      lines.push(
        `- ${point.pointSlug}: ${formatNumber(point.qrLandings)} QR landings, ${formatNumber(point.plannerSubmit)} propostas (QR→proposta: ${formatRate(point.qrToSubmitRate)})`,
      );
    }
    if (report.points.length > 5) {
      lines.push(`... e mais ${report.points.length - 5} ponto(s). Lista completa no CSV anexo.`);
    }
  }
  lines.push("");

  lines.push("DESTAQUES DO PERÍODO");
  if (report.insights.length === 0) {
    lines.push("Sem destaques com dados suficientes neste período.");
  } else {
    for (const insight of report.insights) lines.push(`- ${insight.text}`);
  }
  lines.push("");
  lines.push(
    "Dados brutos do período em anexo (CSV). Eventos de teste/validação são excluídos deste relatório por padrão.",
  );

  return lines.join("\n");
}
