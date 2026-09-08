import type { PlannerSimConfig } from "../../data/planner-options.ts";
import {
  clampSimInput,
  formatCount,
  WIFI_METRIC_LABELS,
  WIFI_MISSING_LABEL,
} from "./audience/index.ts";
import { PLANNER_MEDIA_LABELS, selectionHasDooh, type PlannerPointDetails } from "./selection.ts";

export const INSERTION_REFERENCE_NOTE =
  "Volume de referência da campanha DOOH, sem multiplicar por ponto ou mídia. A distribuição final será definida na proposta comercial.";

/** Usa todos os pontos comerciais; audiência apenas enriquece a solicitação. */
export function buildPlannerProposal(
  points: PlannerPointDetails[],
  config: PlannerSimConfig,
): string {
  const sim = clampSimInput(config);
  const lines = ["Olá! Montei uma campanha no site da MOBTV.", "", `Pontos (${points.length}):`];
  for (const point of points) {
    lines.push(
      `• ${point.name}${point.region ? ` — ${point.region}` : ""}`,
      `  Serviços: ${point.media.map((media) => PLANNER_MEDIA_LABELS[media]).join(" + ")}`,
    );
    const intelligence = point.dooh;
    const metric = intelligence?.monthly ?? intelligence?.baseMetric;
    if (metric) {
      const modeled = metric.metricType === "modeled_impressions";
      const label = modeled ? "Impactos potenciais estimados/mês" : metric.label;
      lines.push(
        `  ${label}: ${metric.estimated ? "≈ " : ""}${formatCount(metric.value)}`,
        `  Fonte: ${metric.source}${metric.period ? ` · ${metric.period}` : ""}`,
      );
      if (intelligence?.methodology?.modelConfidence === "preliminary")
        lines.push("  Estimativa preliminar MOBTV.");
    } else if (point.media.some((media) => media !== "wifi")) {
      lines.push("  DOOH: dados individuais de audiência em atualização.");
    }
    if (point.wifi?.status === "missing")
      lines.push(`  WiFi Ads: ${WIFI_MISSING_LABEL.toLowerCase()}.`);
    if (point.wifi?.status === "available") {
      for (const metric of point.wifi.metrics)
        lines.push(
          `  ${WIFI_METRIC_LABELS[metric.metricType]}: ${formatCount(metric.value)} ${metric.unit} · ${metric.period} · ${metric.source}`,
        );
    }
  }
  lines.push("", "Campanha:", `Duração: ${sim.days} dias`);
  if (selectionHasDooh(points)) {
    lines.push(
      `Volume desejado DOOH: ${formatCount(sim.insertionsPerDay)} inserções/dia`,
      `Total de referência: ${formatCount(sim.days * sim.insertionsPerDay)} inserções`,
      INSERTION_REFERENCE_NOTE,
    );
  }
  if (points.some((point) => point.wifi))
    lines.push(
      "WiFi Ads: formato e volume definidos na proposta, sem conversão de inserções em acessos ou impactos.",
    );
  if (points.some((point) => point.dooh?.monthly))
    lines.push(
      "Audiência histórica dos pontos; impactos não representam pessoas únicas nem entrega garantida da campanha.",
    );
  if (points.some((point) => point.dooh?.monthly?.measurementScope === "environment_reference"))
    lines.push(
      "BRT: medição Datavision do ambiente compartilhada por LED e Tela, contada uma vez por ponto; não é auditoria individual do monitor.",
    );
  if (points.some((point) => point.dooh?.baseMetric && !point.dooh.monthly))
    lines.push(
      "Feira: fluxo estimado de visitantes (30.000/semana × 4), sem ano-base confirmado; não equivale a impactos nem pessoas únicas.",
    );
  lines.push("", "Gostaria de receber uma proposta comercial.");
  return lines.join("\n");
}
