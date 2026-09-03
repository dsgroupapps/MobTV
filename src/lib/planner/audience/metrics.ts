import type { PointMetric } from "../../../data/point-audience-data.ts";
import type { AudienceConfidenceTier, MetricKind } from "./types.ts";

/**
 * Helpers compartilhados entre as estratégias de mídia (`led.ts`, `screen.ts`).
 * Rótulos e classificação de confiança — sem regra específica de nenhuma mídia.
 */

/** Substantivo minúsculo por tipo de métrica — para copy inline. Nunca "pessoas" genérico. */
const METRIC_NOUN: Record<MetricKind, string> = {
  audited_impacts: "impactos",
  passengers: "passageiros",
  attendances: "atendimentos",
  procedures: "procedimentos",
  outpatient_consultations: "consultas",
  estimated_visitors: "visitantes",
  modeled_impressions: "impactos potenciais",
};

export function metricNoun(type: MetricKind): string {
  return METRIC_NOUN[type];
}

export function metricMonthlyLabel(type: MetricKind): string {
  return `${METRIC_NOUN[type]}/mês`;
}

/**
 * Classifica a confiança interna de uma métrica MEDIDA da fonte.
 *  - fonte C → `estimated`
 *  - medida, não-estimada, fonte primária (A) → `measured`
 *  - resto (estimativa documentada / fonte B) → `derived`
 * (Métrica modelada nunca passa por aqui — nasce `derived` na própria estratégia.)
 */
export function metricConfidenceTier(metric: PointMetric): AudienceConfidenceTier {
  if (metric.sourceQuality === "C") return "estimated";
  if (!metric.estimated && metric.sourceQuality === "A") return "measured";
  return "derived";
}

const TIER_RANK: Record<AudienceConfidenceTier, number> = {
  measured: 3,
  derived: 2,
  estimated: 1,
};

/** Menor (pior) nível de confiança entre dois. */
export function worstTier(
  a: AudienceConfidenceTier,
  b: AudienceConfidenceTier,
): AudienceConfidenceTier {
  return TIER_RANK[a] <= TIER_RANK[b] ? a : b;
}

/**
 * Confiança de uma métrica MODELADA (impactos potenciais) a partir da
 * confiança da métrica-base. O modelo sempre adiciona incerteza — nunca
 * melhor que `derived` — mas se a base for só `estimated` (fonte C), o
 * resultado herda `estimated`.
 */
export function modeledTier(baseTier: AudienceConfidenceTier): AudienceConfidenceTier {
  return worstTier(baseTier, "derived");
}

/** Rótulo de ambiente para copy comercial. */
const ENVIRONMENT_LABEL: Record<string, string> = {
  Metrô: "Metrô",
  BRT: "Terminal BRT",
  "Terminal Rodoviário": "Terminal Rodoviário",
  UPA: "UPA",
  Hospital: "Hospital",
  Feira: "Feira",
};

export function environmentLabelFor(researchCategory: string): string {
  return ENVIRONMENT_LABEL[researchCategory] ?? researchCategory;
}

/** Remove o sufixo "(categoria ...)" / "(...)" ao final de um texto de pesquisa. */
export function stripCategoryTag(text: string): string {
  return text.replace(/\s*\([^)]*\)\s*\.?\s*$/u, "").trim();
}

/** "Alimentação rápida, tecnologia, moda (categoria)" -> ["Alimentação rápida", "tecnologia", "moda"] */
export function parseConsumptionCategories(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  const cleaned = stripCategoryTag(raw);
  if (!cleaned) return undefined;
  const parts = cleaned
    .split(/,\s*/u)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

export const INCOME_LABEL: Record<string, string> = {
  domiciliar: "Renda média domiciliar",
  familiar: "Renda média familiar",
  per_capita: "Renda per capita",
};
