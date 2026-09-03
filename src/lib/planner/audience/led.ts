import { pointMediaTypes } from "../../../data/network-points.ts";
import { getPointAudienceData } from "../../../data/point-audience-data.ts";
import { findPointBySlug } from "../../point-slug.ts";
import {
  environmentLabelFor,
  INCOME_LABEL,
  metricConfidenceTier,
  metricMonthlyLabel,
  metricNoun,
  parseConsumptionCategories,
  stripCategoryTag,
} from "./metrics.ts";
import type { LedCampaignModel, PointIntelligence } from "./types.ts";

/**
 * Estratégia de inteligência de audiência para a mídia `Painel LED`.
 *
 * A métrica mensal do Painel LED é SEMPRE `audited_impacts` (impactos/mês
 * medidos pela Datavision, via Mídia Kit MOBTV) — os únicos 7 pontos com
 * Painel LED no catálogo (5 Metrô + 2 BRT) têm exatamente essa métrica em
 * `point-audience-data.ts`. Um ponto sem Painel LED, ou sem impactos
 * auditados, não recebe inteligência LED (retorna `null`).
 */
export function getLedPointIntelligence(slug: string): PointIntelligence | null {
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
    mediaType: "led",
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
  "share de exibição do painel — quantas inserções por dia o loop executa (ou, de forma " +
  "equivalente: duração do loop + duração do spot + nº de anunciantes no loop + horas de " +
  "operação, ou o total de inserções/dia que a MOBTV comercializa por tela/painel). Sem " +
  "isso não é possível converter a quantidade de inserções escolhida em uma fração " +
  "defensável do potencial de exposição do ambiente.";

/**
 * Estimativa de impactos ENTREGUES por uma campanha em um ponto.
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
