import { pointMediaTypes } from "../../../data/network-points.ts";
import { getPointAudienceData, type PointMetric } from "../../../data/point-audience-data.ts";
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
import type { MethodologyNote, PointIntelligence } from "./types.ts";

/**
 * Estratégia de inteligência de audiência para a mídia `Tela` em UPAs.
 *
 * DIFERENÇA para o Painel LED: aqui NÃO existe métrica de impacto auditada.
 * A base MEDIDA é `procedures` (procedimentos/mês, painel InfoSaúde/SES-DF,
 * média jan–jun/2026 — já armazenada em `point-audience-data.ts`, não
 * duplicada aqui). O número de destaque ("impactos potenciais/mês") é
 * DERIVADO por um modelo de mídia e fica sempre com `tier: "derived"`.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MODELO DE IMPACTOS — ANÁLISE E DECISÃO
 * ─────────────────────────────────────────────────────────────────────────
 * Proposta inicial do produto:
 *   impactos potenciais/mês
 *     = procedimentos/mês
 *     × presenceFactor (1,25)              — circulação > nº de procedimentos: parte dos
 *                                            atendimentos leva acompanhante
 *     × exposureFactor (0,80)              — nem todos ficam posicionados para ver a tela
 *     × effectiveExposureFrequency (2,0)   — permanência longa (1h+) gera mais de uma
 *                                            oportunidade de exposição
 *   ⇒ multiplicador efetivo = 1,25 × 0,80 × 2,0 = 2,0
 *
 * O que o projeto tem para calibrar isto:
 *   - `averageDwellTime` das UPAs = "1 hora ou mais" (Mídia Kit, nível categoria)
 *     → sustenta `effectiveExposureFrequency ≥ 1`; um valor de 2,0 para espera de 1h+
 *       é plausível e conservador.
 *   - `targetAudience` = "Pacientes e acompanhantes" (Mídia Kit, nível categoria)
 *     → confirma que há acompanhante ⇒ `presenceFactor > 1`. Literatura de pronto-
 *       atendimento costuma citar taxas de acompanhamento de 30–50%; 1,25 (≈25%)
 *       fica na faixa BAIXA/segura.
 *   - Telas: todas as UPAs têm exatamente 1 monitor 49" (`produtos` em
 *     `network-points.ts`) → não há ajuste por nº de telas.
 *   - NÃO há no projeto: duração do spot, duração do loop, nº de anunciantes no
 *     loop, share of voice, total de inserções/dia, horário de funcionamento,
 *     estudo de OTS/atenção. (Mesma lacuna já registrada para o Painel LED.)
 *
 * DECISÃO: manter 1,25 / 0,80 / 2,0 exatamente como proposto. Nenhum dado do
 * projeto permite derivar coeficientes melhores; os sinais qualitativos
 * disponíveis (acompanhante confirmado, permanência longa, 1 tela) são
 * CONSISTENTES com esses fatores e não os contradizem. Os fatores NÃO foram
 * mexidos para inflar ou reduzir o resultado — ficam no modelo `expected`,
 * único usado pelo site. Cenários `conservative`/`potential` não são
 * implementados agora (evita números fabricados); o seam para adicioná-los
 * depois é o parâmetro de `estimateUpaScreenImpressions`.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const UPA_SCREEN_MODEL = {
  /** circulação física / nº de procedimentos (acompanhantes). */
  presenceFactor: 1.25,
  /** fração dos presentes com oportunidade real de ver a tela. */
  exposureFactor: 0.8,
  /** oportunidades efetivas de exposição durante a permanência (1h+). */
  effectiveExposureFrequency: 2.0,
} as const;

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

const UPA_SCREEN_METHODOLOGY: MethodologyNote = {
  summary:
    "A estimativa utiliza o volume médio mensal de atendimentos do local e fatores de " +
    "circulação, exposição e permanência associados ao ambiente. O resultado representa " +
    "oportunidades potenciais de exposição à mídia e não pessoas únicas.",
  formula:
    "impactos potenciais/mês = procedimentos/mês × 1,25 (circulação com acompanhante) " +
    "× 0,80 (oportunidade de visualização da tela) × 2,00 (frequência efetiva de " +
    "exposição na permanência de 1h+) = procedimentos/mês × 2,00",
};

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
  // Modelo calibrado para UPA (acompanhante + permanência 1h+). Hospitais têm
  // Tela e `attendances` (métrica-base diferente) e ficam para uma fase futura.
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
      }
    : undefined;

  const modeledValue = base ? estimateUpaScreenImpressions(base.value) : undefined;
  const monthly =
    modeledValue != null && base
      ? {
          value: modeledValue,
          metricType: "modeled_impressions" as const,
          label: "impactos potenciais/mês",
          noun: "impactos potenciais",
          period: base.period,
          source: `Estimativa MOBTV (modelo Tela/UPA) sobre ${base.source}`,
          tier: "derived" as const,
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
