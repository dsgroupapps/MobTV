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

/**
 * Estratégia de inteligência de audiência para a mídia `Tela` em HOSPITAIS
 * (`researchCategory === "Hospital"`).
 *
 * Base de dados (2026-09, atualização com competência 2025): InfoSaúde-DF /
 * SES-DF, dados processados pelo Sistema de Informações Ambulatoriais
 * (SIA/MS), coletados manualmente pelo cliente diretamente nos painéis
 * "Emergências Hospitalares" e "Produção ambulatorial dos estabelecimentos
 * da SES-DF" com o estabelecimento selecionado, competência ANO COMPLETO
 * 2025 — já transcritos em `point-audience-data.ts` (não duplicados aqui).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * HIERARQUIA DE METODOLOGIA (mesma regra de terminal-screen.ts)
 * ─────────────────────────────────────────────────────────────────────────
 *   1. tem impacto medido/auditado (`audited_impacts`) → usa o MEDIDO.
 *      Nenhum hospital do catálogo tem isso hoje, mas o código já respeita a
 *      hierarquia caso um dia exista (Datavision só em Metrô/BRT atualmente).
 *   2. sem impacto medido, mas com atividade hospitalar válida → BASE DE
 *      CIRCULAÇÃO combinada (abaixo) alimenta o modelo derivado.
 *   3. sem nenhum dos dois → sem estimativa de impacto; só perfil/demografia.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BASE DE CIRCULAÇÃO — POR QUE NÃO SOMAR emergências + consultas + exames
 * ─────────────────────────────────────────────────────────────────────────
 * Cada hospital tem até 3 métricas de atividade na fonte, e elas NÃO são
 * intercambiáveis nem somáveis ingenuamente:
 *
 *   - `attendances`              — "Emergências Hospitalares" (SIA/MS).
 *   - `outpatient_consultations` — "Produção ambulatorial", filtro Consultas/
 *     atendimentos. Este filtro NÃO é só consulta convencional: inclui
 *     códigos como acolhimento com classificação de risco, atendimento de
 *     urgência em atenção especializada, atendimento de urgência com
 *     observação, teleconsulta, consulta domiciliar etc. — ou seja, tem
 *     SOBREPOSIÇÃO plausível com o painel de emergências (o acolhimento, por
 *     exemplo, tende a acontecer também na porta de entrada da emergência).
 *   - `procedures`               — "Produção ambulatorial", filtro Exames.
 *     São PROCEDIMENTOS, não visitas: uma única passagem pode gerar vários
 *     exames. Indicador AUXILIAR de intensidade, nunca usado como base de
 *     circulação/audiência.
 *
 * Sem um dado que quantifique exatamente a interseção entre os painéis de
 * emergência e de consultas, somar os dois inflaria a base por dupla
 * contagem. A escolha CONSERVADORA e defensável adotada aqui:
 *
 *   base_visitas = max(emergências/mês, consultas/mês)
 *
 * — o maior dos dois funciona como PISO da circulação real (a união de dois
 * conjuntos que se sobrepõem é sempre ≥ o maior deles), sem inventar um
 * "componente incremental" da métrica menor que não temos como calcular.
 * `exames` e a produção ambulatorial TOTAL do estabelecimento (quando
 * disponível) ficam de fora do modelo — só registrados em `point-audience-
 * data.ts` como contexto de intensidade, nunca como circulação/audiência.
 *
 * Os valores em si (attendances/outpatient_consultations) são dados OFICIAIS
 * observados (InfoSaúde-DF/SIA-MS, sourceQuality A, estimated=false) — a
 * escolha de qual usar como base (o maior) é uma decisão de METODOLOGIA de
 * modelagem, não rebaixa a métrica escolhida: `baseMetric.tier` permanece
 * "measured". A estimativa (`monthly`, modeled_impressions) é que herda
 * incerteza via `modeledTier`.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MODELO DE IMPACTOS — REVISÃO CRÍTICA (não copiado automaticamente da UPA)
 * ─────────────────────────────────────────────────────────────────────────
 * Fatores propostos nesta rodada: presenceFactor 1,25 (paciente + acompan-
 * hante) × exposureFactor 0,80 (nem toda circulação vê a tela) ×
 * effectiveExposureFrequency — proposto inicialmente em 2,20 (permanência
 * longa + espera + circulação recorrente).
 *
 * Revisão feita (permanência, localização/nº de telas, presença de
 * acompanhante, repetição de exposição): a atualização de 2025 troca APENAS
 * os números de ATIVIDADE (emergências/consultas/exames) — não trouxe
 * nenhuma informação nova sobre tempo de permanência, posição das telas, nº
 * de monitores por hospital (Taguatinga e Santa Maria têm 2, Ceilândia 2,
 * Gama 1 — mesma contagem já conhecida) ou padrão de circulação interna.
 * A única evidência de permanência que o projeto tem para hospital continua
 * sendo `averageDwellTime`/`targetAudience` — e ela é LITERALMENTE o mesmo
 * texto usado nas UPAs: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit
 * MOBTV)" e "Pacientes e acompanhantes (categoria)". O próprio Mídia Kit
 * trata UPA e Hospital como UMA categoria de permanência/perfil, sem
 * distinguir tempo de espera, área da tela ou circulação entre os dois
 * ambientes. Não existe no projeto nenhum dado, novo ou antigo, que sustente
 * uma frequência de exposição MAIOR para hospital do que para UPA.
 *
 * DECISÃO (mantida desta rodada anterior, reconfirmada agora com os dados
 * novos): `effectiveExposureFrequency` = **2,0** (igual à UPA), não 2,20.
 * `presenceFactor` (1,25) e `exposureFactor` (0,80) mantidos pelo mesmo
 * racional (acompanhante confirmado na base; nem toda circulação vê a tela).
 * Multiplicador efetivo = 1,25 × 0,80 × 2,0 = **2,0**. Modelo mantido
 * próprio (`HOSPITAL_SCREEN_MODEL`), não um alias do de UPA, para poder
 * recalibrar os dois independentemente se um dia surgir dado específico de
 * hospital (ex.: nº real de telas por área, horário, loop).
 * ─────────────────────────────────────────────────────────────────────────
 */
export const HOSPITAL_SCREEN_MODEL = {
  /** circulação física / atividade hospitalar (paciente + acompanhante). */
  presenceFactor: 1.25,
  /** fração dos presentes com oportunidade real de ver a tela. */
  exposureFactor: 0.8,
  /**
   * Oportunidades efetivas de exposição durante a permanência. Igual ao
   * modelo de UPA (2,0), não 2,20 como inicialmente proposto — ver revisão
   * acima: a base trata UPA e Hospital como a mesma categoria de
   * permanência, sem dado que justifique frequência maior para hospital.
   */
  effectiveExposureFrequency: 2.0,
} as const;

/** Multiplicador efetivo do modelo (= 1,25 × 0,80 × 2,0 = 2,0). */
export const HOSPITAL_SCREEN_MULTIPLIER =
  HOSPITAL_SCREEN_MODEL.presenceFactor *
  HOSPITAL_SCREEN_MODEL.exposureFactor *
  HOSPITAL_SCREEN_MODEL.effectiveExposureFrequency;

/**
 * Converte a base de circulação hospitalar/mês em impactos potenciais/mês
 * pelo modelo MOBTV Tela/Hospital. Programático — nunca gravar o resultado
 * à mão.
 */
export function estimateHospitalScreenImpressions(monthlyHospitalActivity: number): number {
  return Math.round(monthlyHospitalActivity * HOSPITAL_SCREEN_MULTIPLIER);
}

const HOSPITAL_SCREEN_METHODOLOGY: MethodologyNote = {
  summary:
    "A estimativa utiliza o volume médio de atendimentos do hospital e fatores associados à " +
    "presença, oportunidade e frequência de exposição às telas. O resultado representa " +
    "oportunidades potenciais de exposição à mídia e não pessoas únicas.",
  formula:
    "impactos potenciais/mês = base de circulação/mês (maior entre emergências e consultas/" +
    "atendimentos ambulatoriais — nunca a soma, por sobreposição de códigos) × 1,25 (circulação " +
    "com acompanhante) × 0,80 (oportunidade de visualização da tela) × 2,00 (frequência efetiva " +
    "de exposição, mesma permanência 1h+ da categoria UPAs/Hospitais) = base de circulação/mês × 2,00",
};

const OVERLAP_CAVEAT =
  "Maior valor entre emergências hospitalares e consultas/atendimentos do painel ambulatorial " +
  "(InfoSaúde-DF/SIA-MS) — usado como piso conservador da circulação, para evitar dupla " +
  "contagem por sobreposição de códigos entre os dois painéis (ex.: acolhimento com " +
  "classificação de risco pode ocorrer nos dois). Exames e produção ambulatorial total não " +
  "entram nesta base — são procedimentos, não visitas.";

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
    // 2. base de circulação = maior entre emergências e consultas (nunca a
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
      label: "impactos potenciais/mês",
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
