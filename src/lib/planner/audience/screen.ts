import { pointMediaTypes } from "../../../data/network-points.ts";
import { getPointAudienceData, type PointMetric } from "../../../data/point-audience-data.ts";
import { findPointBySlug } from "../../point-slug.ts";
import {
  environmentLabelFor,
  INCOME_LABEL,
  metricConfidenceTier,
  metricMonthlyLabel,
  metricNoun,
  modeledTier,
  parseConsumptionCategories,
  stripCategoryTag,
} from "./metrics.ts";
import type { MethodologyNote, PointIntelligence } from "./types.ts";

import { HEALTHCARE_SCREEN_MODELS, healthcareMethodology } from "./healthcare-model.ts";

/**
 * Modelo preliminar MOBTV sobre atividade assistencial observada no InfoSaúde.
 * Os parâmetros são hipóteses, não dados medidos de presença ou circulação.
 * A qualidade oficial da base permanece independente da confiança do modelo.
 * UPA utiliza procedimentos, sem equipará-los a visitas ou pessoas.
 * Impactos são oportunidades estimadas, não uma medição.
 * Exames e produção ambulatorial total não são convertidos em visitantes.
 */
export const UPA_SCREEN_MODEL = HEALTHCARE_SCREEN_MODELS.upa;

/** Multiplicador efetivo do modelo `expected` (= 1,25 × 0,80 × 2,0 = 2,0). */
export const UPA_SCREEN_MULTIPLIER =
  UPA_SCREEN_MODEL.presenceFactor *
  UPA_SCREEN_MODEL.exposureFactor *
  UPA_SCREEN_MODEL.effectiveExposureFrequency;

/**
 * Converte procedimentos/mês em impactos potenciais/mês pelo modelo MOBTV
 * Tela/UPA. Programático — nunca gravar o resultado à mão.
 */
export function estimateUpaScreenImpressions(monthlyProcedures: number): number {
  return Math.round(monthlyProcedures * UPA_SCREEN_MULTIPLIER);
}

const UPA_SCREEN_METHODOLOGY = healthcareMethodology("upa");

/**
 * Monta a inteligência de audiência de um ponto para a mídia `Tela` em UPA.
 *
 * Retorna `null` quando o ponto não tem `Tela`, quando não é uma UPA (o
 * modelo é específico de UPA nesta fase) ou quando o slug não existe.
 * Quando é uma UPA com Tela mas SEM `procedures` na base, retorna a
 * inteligência com perfil/demografia disponíveis e SEM `monthly`/`baseMetric`
 * (a UI mostra "dados de audiência detalhados em atualização", nunca inventa).
 */
export function getUpaScreenPointIntelligence(slug: string): PointIntelligence | null {
  const found = findPointBySlug(slug);
  if (!found) return null;
  if (!pointMediaTypes(found.point).includes("screen")) return null;

  const data = getPointAudienceData(slug);
  if (!data) return null;
  // Estratégia exclusiva de UPA; hospitais usam sua própria proxy de atividade.
  if (data.researchCategory !== "UPA") return null;

  const base: PointMetric | undefined = data.metrics.find((metric) => metric.type === "procedures");

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

  const baseMetric = base
    ? {
        value: base.value,
        metricType: base.type,
        label: metricMonthlyLabel(base.type),
        noun: metricNoun(base.type),
        period: base.period,
        source: base.source,
        tier: metricConfidenceTier(base),
        estimated: base.estimated,
        sourceQuality: base.sourceQuality,
      }
    : undefined;

  const modeledValue = base ? estimateUpaScreenImpressions(base.value) : undefined;
  const monthly =
    modeledValue != null && baseMetric
      ? {
          value: modeledValue,
          metricType: "modeled_impressions" as const,
          label: "Impactos potenciais estimados/mês",
          noun: "impactos potenciais",
          period: baseMetric.period,
          source: `Estimativa MOBTV (modelo Tela/UPA) sobre ${baseMetric.source}`,
          tier: modeledTier(baseMetric.tier),
          estimated: true,
        }
      : undefined;

  return {
    slug,
    mediaType: "screen",
    researchCategory: data.researchCategory,
    environmentLabel: environmentLabelFor(data.researchCategory),
    referenceArea: data.referenceArea,
    monthly,
    baseMetric,
    dailyReference: monthly ? { value: Math.round(monthly.value / 30) } : undefined,
    methodology: monthly ? UPA_SCREEN_METHODOLOGY : undefined,
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
    // `averageDwellTime`, `targetAudience` e `consumptionProfile` das UPAs vêm
    // rotulados "(categoria)" na fonte — caracterização do inventário UPA/
    // Hospital MOBTV, não medição do ponto. A demografia acima É do ponto.
    profileIsCategoryLevel: hasBehavior ? true : undefined,
  };
}
