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

/**
 * Estratégia de inteligência de audiência para a mídia `Tela` em
 * TERMINAIS / RODOVIÁRIAS (categorias de pesquisa "BRT" e "Terminal
 * Rodoviário").
 *
 * ─────────────────────────────────────────────────────────────────────────
 * HIERARQUIA DE METODOLOGIA (regra crítica — não substituir Datavision)
 * ─────────────────────────────────────────────────────────────────────────
 *   1. tem impacto medido/auditado (`audited_impacts`, Datavision) → USA O
 *      MEDIDO, tal como o `Painel LED` faz. Nada de `fluxo × multiplicador`
 *      por cima de uma métrica de impacto superior e mais confiável.
 *      (Terminal BRT Gama ≈ 2.149.173/mês, Terminal BRT Santa Maria ≈
 *      3.745.600/mês — permanecem medidos, independentemente de a mídia
 *      escolhida ser `Tela` ou `Painel LED`.)
 *   2. sem impacto medido, mas com fluxo de passageiros → modelo DERIVADO
 *      (abaixo).
 *   3. sem nenhum dos dois → sem estimativa de impacto; só perfil/demografia.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MODELO DE IMPACTOS DERIVADO — ANÁLISE E DECISÃO
 * ─────────────────────────────────────────────────────────────────────────
 * Proposta inicial do produto (sem fator de acompanhante — o fluxo de
 * passageiros já é a circulação/presença no ambiente):
 *   impactos potenciais/mês
 *     = fluxo de passageiros/mês
 *     × exposureFactor (0,80)              — nem todo passageiro tem
 *                                            oportunidade visual adequada da tela
 *     × effectiveExposureFrequency (1,50)  — deslocamento + espera curta permitem
 *                                            mais de um contato visual na passagem
 *   ⇒ multiplicador efetivo = 0,80 × 1,50 = 1,20
 *
 * Calibração contra os terminais que têm Datavision + fluxo:
 *   - BRT Santa Maria: fluxo ~375.000 (Mídia Kit, estimado) × ? = 3.745.600 (Datavision) ⇒ ~9,99×
 *   - BRT Gama:        fluxo ~350.000 (Mídia Kit, estimado) × ? = 2.149.173 (Datavision) ⇒ ~6,14×
 *   Os dois multiplicadores implícitos são MUITO altos e INCONSISTENTES entre
 *   si (6,1× vs 10,0×). Motivo: o número Datavision desses pontos é a SOMA de
 *   2 PAINÉIS DE LED grandes, contando oportunidades de exposição do mês
 *   inteiro com alta frequência — base de medição completamente diferente de
 *   "passageiros × oportunidade visual" numa TELA (Monitor 49"). O fluxo em
 *   si também é só uma estimativa arredondada do Mídia Kit. Forçar o modelo a
 *   reproduzir esses ratios inflaria a estimativa ~5–8× sem base defensável.
 *   ⇒ os terminais Datavision NÃO servem de calibração metodologicamente
 *      válida para a relação fluxo→impacto de TELA. Comparação feita e
 *      REJEITADA.
 *
 * Coerência com o modelo de UPA/Tela (× 2,0): o terminal recebe um
 * multiplicador MENOR (× 1,2) porque (a) não há acompanhante e (b) a
 * permanência é curta (~6–15 min, categoria Metrô/BRT do Mídia Kit) contra
 * "1h+" nas UPAs — menos oportunidades de repetição (1,50 vs 2,0).
 *
 * DECISÃO: manter 0,80 × 1,50 = 1,20 exatamente como proposto. Nenhum dado do
 * projeto sustenta um coeficiente melhor; os fatores NÃO foram mexidos para
 * inflar/reduzir. Único modelo usado pelo site.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const TERMINAL_SCREEN_MODEL = {
  /** fração dos passageiros com oportunidade real de ver a tela. */
  exposureFactor: 0.8,
  /** contatos visuais efetivos na passagem (deslocamento + espera curta). */
  effectiveExposureFrequency: 1.5,
} as const;

/** Multiplicador efetivo do modelo (= 0,80 × 1,50 = 1,20). Arredondado p/ evitar ruído de ponto flutuante. */
export const TERMINAL_SCREEN_MULTIPLIER =
  Math.round(
    TERMINAL_SCREEN_MODEL.exposureFactor * TERMINAL_SCREEN_MODEL.effectiveExposureFrequency * 1e6,
  ) / 1e6;

/**
 * Converte fluxo de passageiros/mês em impactos potenciais/mês pelo modelo
 * MOBTV Tela/terminal. Programático — nunca gravar o resultado à mão.
 */
export function estimateTerminalScreenImpressions(monthlyPassengerFlow: number): number {
  return Math.round(monthlyPassengerFlow * TERMINAL_SCREEN_MULTIPLIER);
}

const TERMINAL_RESEARCH_CATEGORIES = new Set(["BRT", "Terminal Rodoviário"]);

const TERMINAL_SCREEN_METHODOLOGY: MethodologyNote = {
  summary:
    "A estimativa considera o fluxo médio de passageiros do local e fatores associados à " +
    "oportunidade e à frequência de exposição às telas. O resultado representa impactos " +
    "potenciais e não pessoas únicas.",
  formula:
    "impactos potenciais/mês = fluxo de passageiros/mês × 0,80 (oportunidade visual da tela) " +
    "× 1,50 (frequência efetiva de contato na passagem) = fluxo de passageiros/mês × 1,20",
};

/**
 * Monta a inteligência de audiência de um ponto para a mídia `Tela` em
 * terminal/rodoviária.
 *
 * Retorna `null` quando o ponto não tem `Tela`, quando não é terminal/
 * rodoviária (BRT ou Terminal Rodoviário), ou quando o slug não existe.
 * Quando tem `Tela` mas nem impacto medido nem fluxo, retorna a inteligência
 * com perfil/demografia e SEM `monthly`/`baseMetric`.
 */
export function getTerminalScreenPointIntelligence(slug: string): PointIntelligence | null {
  const found = findPointBySlug(slug);
  if (!found) return null;
  if (!pointMediaTypes(found.point).includes("screen")) return null;

  const data = getPointAudienceData(slug);
  if (!data) return null;
  if (!TERMINAL_RESEARCH_CATEGORIES.has(data.researchCategory)) return null;

  const measured: PointMetric | undefined = data.metrics.find((m) => m.type === "audited_impacts");
  const flow: PointMetric | undefined = data.metrics.find((m) => m.type === "passengers");

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
  let monthly: PointIntelligence["monthly"];
  let baseMetric: PointIntelligence["baseMetric"];
  let methodology: MethodologyNote | undefined;

  if (measured) {
    // 1. impacto medido/auditado (Datavision) — nunca substituído por fluxo.
    monthly = {
      value: measured.value,
      metricType: measured.type,
      label: metricMonthlyLabel(measured.type),
      noun: metricNoun(measured.type),
      period: measured.period,
      source: measured.source,
      tier: metricConfidenceTier(measured),
      estimated: measured.estimated,
    };
  } else if (flow) {
    // 2. fluxo de passageiros → modelo derivado.
    baseMetric = {
      value: flow.value,
      metricType: flow.type,
      label: metricMonthlyLabel(flow.type),
      noun: metricNoun(flow.type),
      period: flow.period,
      source: flow.source,
      tier: metricConfidenceTier(flow),
      estimated: flow.estimated,
    };
    monthly = {
      value: estimateTerminalScreenImpressions(flow.value),
      metricType: "modeled_impressions",
      label: "impactos potenciais/mês",
      noun: "impactos potenciais",
      period: flow.period,
      source: `Estimativa MOBTV (modelo Tela/terminal) sobre ${flow.source}`,
      tier: modeledTier(baseMetric.tier),
      estimated: true,
    };
    methodology = TERMINAL_SCREEN_METHODOLOGY;
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
    // `averageDwellTime`/`targetAudience`/`consumptionProfile` vêm rotulados
    // "(categoria)" na fonte (perfil Metrô/BRT MOBTV) — só existem para os
    // pontos BRT; os terminais rodoviários (Setor O, Sobradinho) não têm esse
    // bloco na base e não recebem um perfil fabricado.
    profileIsCategoryLevel: hasBehavior ? true : undefined,
  };
}
