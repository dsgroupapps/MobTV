import type { AnalyticsReport, FunnelStepResult, Insight } from "./types.ts";

function topBy<T>(items: T[], keyFn: (item: T) => number): T | undefined {
  return items.reduce<T | undefined>(
    (best, item) => (best === undefined || keyFn(item) > keyFn(best) ? item : best),
    undefined,
  );
}

function biggestDropOff(
  steps: FunnelStepResult[],
): { fromLabel: string; toLabel: string; pct: number } | undefined {
  let worst: { fromLabel: string; toLabel: string; pct: number } | undefined;
  for (let i = 1; i < steps.length; i++) {
    const progression = steps[i].pctOfPreviousStep;
    if (progression === null) continue;
    if (!worst || progression < worst.pct) {
      worst = { fromLabel: steps[i - 1].label, toLabel: steps[i].label, pct: progression };
    }
  }
  return worst;
}

/**
 * Insights DETERMINÍSTICOS — nenhum LLM, nenhuma causalidade inferida. Cada
 * frase descreve só o que os números mostram ("X representou Y% de Z"),
 * nunca uma intenção/comportamento do usuário (ex. nunca "usuários de X
 * demonstram mais interesse"). Quando não há dado suficiente para um
 * insight (ex. nenhum ponto no período, nenhuma sessão com OS conhecido),
 * ele é OMITIDO da lista — nunca preenchido com um valor inventado ou 0%
 * enganoso.
 */
export function computeInsights(report: AnalyticsReport): Insight[] {
  const insights: Insight[] = [];

  const topQrPoint = topBy(report.points, (p) => p.qrLandings);
  if (topQrPoint && topQrPoint.qrLandings > 0) {
    insights.push({
      key: "top_qr_point",
      text: `"${topQrPoint.pointSlug}" teve o maior número de QR landings no período (${topQrPoint.qrLandings}).`,
    });
  }

  const topPlannerStartPoint = topBy(report.points, (p) => p.plannerStart);
  if (topPlannerStartPoint && topPlannerStartPoint.plannerStart > 0) {
    insights.push({
      key: "top_planner_start_point",
      text: `"${topPlannerStartPoint.pointSlug}" teve o maior número de sessões iniciando o planejador (${topPlannerStartPoint.plannerStart}).`,
    });
  }

  const topSubmitPoint = topBy(report.points, (p) => p.plannerSubmit);
  if (topSubmitPoint && topSubmitPoint.plannerSubmit > 0) {
    insights.push({
      key: "top_submit_point",
      text: `"${topSubmitPoint.pointSlug}" teve o maior número de propostas solicitadas (${topSubmitPoint.plannerSubmit}).`,
    });
  }

  const topOs = topBy(
    report.operatingSystems.filter((o) => o.value !== "unknown"),
    (o) => o.sessions,
  );
  if (topOs) {
    insights.push({
      key: "top_os",
      text: `${topOs.value} representou ${topOs.pct.toFixed(0)}% das sessões no período.`,
    });
  }

  const topDevice = topBy(
    report.devices.filter((d) => d.value !== "unknown"),
    (d) => d.sessions,
  );
  if (topDevice) {
    insights.push({
      key: "top_device",
      text: `${topDevice.value} representou ${topDevice.pct.toFixed(0)}% das sessões no período.`,
    });
  }

  const topBrowser = topBy(
    report.browsers.filter((b) => b.value !== "unknown"),
    (b) => b.sessions,
  );
  if (topBrowser) {
    insights.push({
      key: "top_browser",
      text: `${topBrowser.value} representou ${topBrowser.pct.toFixed(0)}% das sessões no período.`,
    });
  }

  const dropOff = biggestDropOff(report.funnel.steps);
  if (dropOff) {
    insights.push({
      key: "biggest_drop_off",
      text: `A maior queda do funil geral foi entre "${dropOff.fromLabel}" e "${dropOff.toLabel}" (${dropOff.pct.toFixed(0)}% de progressão).`,
    });
  }

  const pointViewsChange = report.comparison?.pointViews.percentChange ?? null;
  if (pointViewsChange !== null) {
    const direction = pointViewsChange >= 0 ? "aumento" : "queda";
    insights.push({
      key: "point_views_vs_previous_period",
      text: `Visualizações de ponto tiveram ${direction} de ${Math.abs(pointViewsChange).toFixed(0)}% em relação ao período anterior.`,
    });
  }

  return insights;
}
