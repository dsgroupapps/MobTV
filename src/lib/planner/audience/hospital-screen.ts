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
import type { MethodologyNote, MonthlyAudienceMetric, PointIntelligence } from "./types.ts";

import { HEALTHCARE_SCREEN_MODELS, healthcareMethodology } from "./healthcare-model.ts";

/**
 * Modelo preliminar MOBTV sobre atividade assistencial observada no InfoSaúde.
 * Os parâmetros são hipóteses, não dados medidos de presença ou circulação.
 * A qualidade oficial da base permanece independente da confiança do modelo.
 * Hospital usa max(emergências, consultas/atendimentos) como proxy de atividade;
 * essa escolha não comprova um piso de circulação nem deduplica visitas.
 * Exames e produção ambulatorial total não são convertidos em visitantes.
 */
export const HOSPITAL_SCREEN_MODEL = HEALTHCARE_SCREEN_MODELS.hospital;

/** Multiplicador efetivo do modelo (= 1,25 × 0,80 × 2,0 = 2,0). */
export const HOSPITAL_SCREEN_MULTIPLIER =
  HOSPITAL_SCREEN_MODEL.presenceFactor *
  HOSPITAL_SCREEN_MODEL.exposureFactor *
  HOSPITAL_SCREEN_MODEL.effectiveExposureFrequency;

/**
 * Converte a proxy de atividade hospitalar/mês em impactos potenciais/mês
 * pelo modelo MOBTV Tela/Hospital. Programático — nunca gravar o resultado
 * à mão.
 */
export function estimateHospitalScreenImpressions(monthlyHospitalActivity: number): number {
  return Math.round(monthlyHospitalActivity * HOSPITAL_SCREEN_MULTIPLIER);
}

const HOSPITAL_SCREEN_METHODOLOGY = healthcareMethodology("hospital");

const OVERLAP_CAVEAT =
  "O modelo usa o maior valor entre emergências e consultas/atendimentos como proxy de atividade. " +
  "Não soma os dois por possível sobreposição e não comprova circulação ou pessoas únicas. " +
  "Exames e produção ambulatorial total ficam fora do cálculo.";

function toMonthlyMetric(metric: PointMetric, caveat?: string): MonthlyAudienceMetric {
  return {
    value: metric.value,
    metricType: metric.type,
    label: metricMonthlyLabel(metric.type),
    noun: metricNoun(metric.type),
    period: metric.period,
    source: metric.source,
    tier: metricConfidenceTier(metric),
    estimated: metric.estimated,
    sourceQuality: metric.sourceQuality,
    measurementScope: metric.measurementScope,
    annualValue: metric.annualValue,
    caveat,
  };
}

/**
 * Monta a inteligência de audiência de um ponto para a mídia `Tela` em
 * hospital.
 *
 * Retorna `null` quando o ponto não tem `Tela`, quando não é hospital
 * (`researchCategory !== "Hospital"`), ou quando o slug não existe. Quando
 * tem `Tela` mas nem impacto medido nem atividade hospitalar válida, retorna
 * a inteligência com perfil/demografia e SEM `monthly`/`baseMetric`.
 */
export function getHospitalScreenPointIntelligence(slug: string): PointIntelligence | null {
  const found = findPointBySlug(slug);
  if (!found) return null;
  if (!pointMediaTypes(found.point).includes("screen")) return null;

  const data = getPointAudienceData(slug);
  if (!data) return null;
  if (data.researchCategory !== "Hospital") return null;

  const measured = data.metrics.find((m) => m.type === "audited_impacts");
  const emergency = data.metrics.find((m) => m.type === "attendances");
  const consultations = data.metrics.find((m) => m.type === "outpatient_consultations");

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

  // ── Hierarquia de metodologia ──────────────────────────────────────────
  let monthly: MonthlyAudienceMetric | undefined;
  let baseMetric: MonthlyAudienceMetric | undefined;
  let methodology: MethodologyNote | undefined;

  if (measured) {
    // 1. impacto medido/auditado — nunca substituído por atividade/modelo.
    monthly = toMonthlyMetric(measured);
  } else if (emergency || consultations) {
    // 2. proxy de atividade = maior entre emergências e consultas (nunca a
    // soma — ver análise de sobreposição no comentário do módulo).
    const chosen =
      emergency && consultations
        ? consultations.value >= emergency.value
          ? consultations
          : emergency
        : (consultations ?? emergency)!;
    baseMetric = toMonthlyMetric(chosen, emergency && consultations ? OVERLAP_CAVEAT : undefined);
    monthly = {
      value: estimateHospitalScreenImpressions(chosen.value),
      metricType: "modeled_impressions",
      label: "Impactos potenciais estimados/mês",
      noun: "impactos potenciais",
      period: chosen.period,
      source: `Estimativa MOBTV (modelo Tela/Hospital) sobre ${chosen.source}`,
      tier: modeledTier(baseMetric.tier),
      estimated: true,
    };
    methodology = HOSPITAL_SCREEN_METHODOLOGY;
  }
  // 3. else: sem monthly/baseMetric — a UI mostra "estimativa detalhada em atualização".

  return {
    slug,
    mediaType: "screen",
    researchCategory: data.researchCategory,
    environmentLabel: environmentLabelFor(data.researchCategory),
    referenceArea: data.referenceArea,
    monthly,
    baseMetric,
    dailyReference: monthly ? { value: Math.round(monthly.value / 30) } : undefined,
    methodology,
    demographics: hasDemographics
      ? {
          averageAge: demographicsRaw?.averageAge,
          genderFemalePercent: demographicsRaw?.gender?.femalePercent,
          genderMalePercent: demographicsRaw?.gender?.malePercent,
          // Renda: só entra quando a base tem valor — nunca inventado onde é N/D.
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
    // dwell/perfil/interesses vêm rotulados "(categoria UPAs/Hospitais)" na
    // fonte — perfil de CATEGORIA compartilhado com UPA, não medição do
    // ponto. A demografia acima É do ponto (idade/gênero/renda variam por RA).
    profileIsCategoryLevel: hasBehavior ? true : undefined,
  };
}
