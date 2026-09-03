import { pointMediaTypes } from "../../../data/network-points.ts";
import {
  getPointAudienceData,
  type MetricType,
  type PointMetric,
} from "../../../data/point-audience-data.ts";
import { findPointBySlug } from "../../point-slug.ts";
import type { AudienceConfidenceTier, LedCampaignModel, LedPointIntelligence } from "./types.ts";

/**
 * Estratégia de inteligência de audiência para a mídia `Painel LED`.
 *
 * A métrica mensal do Painel LED é SEMPRE `audited_impacts` (impactos/mês
 * medidos pela Datavision, via Mídia Kit MOBTV) — os únicos 7 pontos com
 * Painel LED no catálogo (5 Metrô + 2 BRT) têm exatamente essa métrica em
 * `point-audience-data.ts`. Um ponto sem Painel LED, ou sem impactos
 * auditados, não recebe inteligência LED (retorna `null`).
 */

/** Substantivo minúsculo por tipo de métrica — para copy inline. Nunca "pessoas" genérico. */
const METRIC_NOUN: Record<MetricType, string> = {
  audited_impacts: "impactos",
  passengers: "passageiros",
  attendances: "atendimentos",
  procedures: "procedimentos",
  outpatient_consultations: "consultas",
  estimated_visitors: "visitantes",
};

export function metricNoun(type: MetricType): string {
  return METRIC_NOUN[type];
}

export function metricMonthlyLabel(type: MetricType): string {
  return `${METRIC_NOUN[type]}/mês`;
}

/**
 * Classifica a confiança interna de uma métrica.
 *  - fonte C, ou estimativa de fonte C → `estimated`
 *  - medida, não-estimada, fonte primária (A) → `measured`
 *  - resto (estimativa documentada / fonte B) → `derived`
 */
export function metricConfidenceTier(metric: PointMetric): AudienceConfidenceTier {
  if (metric.sourceQuality === "C") return "estimated";
  if (!metric.estimated && metric.sourceQuality === "A") return "measured";
  return "derived";
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

function environmentLabelFor(researchCategory: string): string {
  return ENVIRONMENT_LABEL[researchCategory] ?? researchCategory;
}

/** Remove o sufixo "(categoria ...)" / "(...)" ao final de um texto de pesquisa. */
function stripCategoryTag(text: string): string {
  return text.replace(/\s*\([^)]*\)\s*\.?\s*$/u, "").trim();
}

/** "Alimentação rápida, tecnologia, moda (categoria)" -> ["Alimentação rápida", "tecnologia", "moda"] */
function parseConsumptionCategories(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  const cleaned = stripCategoryTag(raw);
  if (!cleaned) return undefined;
  const parts = cleaned
    .split(/,\s*/u)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

const INCOME_LABEL: Record<string, string> = {
  domiciliar: "Renda média domiciliar",
  familiar: "Renda média familiar",
  per_capita: "Renda per capita",
};

/**
 * Monta a inteligência de audiência de um ponto para `Painel LED`.
 * Retorna `null` se o ponto não tem Painel LED ou não tem impactos auditados.
 */
export function getLedPointIntelligence(slug: string): LedPointIntelligence | null {
  const found = findPointBySlug(slug);
  if (!found) return null;
  if (!pointMediaTypes(found.point).includes("led")) return null;

  const data = getPointAudienceData(slug);
  if (!data) return null;

  const monthly = data.metrics.find((metric) => metric.type === "audited_impacts");
  if (!monthly) return null;

  const demographicsRaw = data.demographics;
  const hasDemographics =
    demographicsRaw?.averageAge != null || demographicsRaw?.gender != null || data.income != null;

  const consumptionCategories = parseConsumptionCategories(data.consumptionProfile);
  const audienceProfile = data.targetAudience ? stripCategoryTag(data.targetAudience) : undefined;
  const dwellTime = data.averageDwellTime ? stripCategoryTag(data.averageDwellTime) : undefined;
  const hasBehavior =
    (dwellTime && dwellTime.length > 0) ||
    (audienceProfile && audienceProfile.length > 0) ||
    (consumptionCategories && consumptionCategories.length > 0);

  return {
    slug,
    researchCategory: data.researchCategory,
    environmentLabel: environmentLabelFor(data.researchCategory),
    referenceArea: data.referenceArea,
    monthly: {
      value: monthly.value,
      metricType: monthly.type,
      label: metricMonthlyLabel(monthly.type),
      noun: metricNoun(monthly.type),
      period: monthly.period,
      source: monthly.source,
      tier: metricConfidenceTier(monthly),
      estimated: monthly.estimated,
    },
    dailyReference: { value: Math.round(monthly.value / 30) },
    demographics: hasDemographics
      ? {
          averageAge: demographicsRaw?.averageAge,
          genderFemalePercent: demographicsRaw?.gender?.femalePercent,
          genderMalePercent: demographicsRaw?.gender?.malePercent,
          income: data.income
            ? {
                value: data.income.value,
                label: INCOME_LABEL[data.income.type] ?? "Renda média",
                type: data.income.type,
                typeLabel: data.income.typeLabel,
              }
            : undefined,
        }
      : undefined,
    behavior: hasBehavior
      ? {
          dwellTime: dwellTime && dwellTime.length > 0 ? dwellTime : undefined,
          audienceProfile:
            audienceProfile && audienceProfile.length > 0 ? audienceProfile : undefined,
          consumptionCategories,
        }
      : undefined,
  };
}

/**
 * Modelos de campanha por ponto (share de exibição do Painel LED).
 *
 * VAZIO DE PROPÓSITO. Não há, em nenhuma fonte do projeto (Mídia Kit, rate
 * card 2026, planilha mestre), o dado que liga a audiência auditada do painel
 * a uma quantidade de inserções: não há loop, faces ativas, duração de spot
 * nem share de exibição publicados. Enquanto isso, `estimateLedCampaignImpacts`
 * retorna `null` e a UI não mostra "impactos estimados da campanha".
 *
 * Para ativar a estimativa: adicionar `["<slug>"]: { loopInsertionsPerDay, methodology }`.
 */
export const ledCampaignModels: Record<string, LedCampaignModel> = {};

export const LED_CAMPAIGN_MISSING_VARIABLE =
  "share de exibição do Painel LED — quantas inserções por dia o loop do painel executa " +
  "(ou, de forma equivalente: duração do loop + duração do spot + horas de operação, " +
  "ou o total de inserções/dia que a MOBTV comercializa por painel). Sem isso não é " +
  "possível converter a quantidade de inserções escolhida em uma fração defensável da " +
  "audiência mensal auditada.";

/**
 * Estimativa de impactos ENTREGUES por uma campanha em um ponto LED.
 *
 * Fórmula (documentada, ativada só quando existir `model`):
 *   shareOfVoice   = min(1, insertionsPerDay / model.loopInsertionsPerDay)
 *   campaignImpacts = monthlyImpacts × (days / 30) × shareOfVoice
 *
 * Sem `model` retorna `null` + o nome da variável que falta — NUNCA um
 * coeficiente arbitrário.
 */
export function estimateLedCampaignImpacts(params: {
  monthlyImpacts: number;
  days: number;
  insertionsPerDay: number;
  model?: LedCampaignModel;
}): { value: number | null; missingVariable: string | null } {
  const { monthlyImpacts, days, insertionsPerDay, model } = params;
  if (!model || model.loopInsertionsPerDay <= 0) {
    return { value: null, missingVariable: LED_CAMPAIGN_MISSING_VARIABLE };
  }
  const shareOfVoice = Math.min(1, insertionsPerDay / model.loopInsertionsPerDay);
  const value = Math.round(monthlyImpacts * (days / 30) * shareOfVoice);
  return { value, missingVariable: null };
}
