import type { MediaTypeKey } from "../../../data/network-points.ts";
import type { IncomeType } from "../../../data/point-audience-data.ts";
import { estimateLedCampaignImpacts, getLedPointIntelligence, ledCampaignModels } from "./led.ts";
import { getUpaScreenPointIntelligence } from "./screen.ts";
import { getTerminalScreenPointIntelligence } from "./terminal-screen.ts";
import { INCOME_LABEL, worstTier } from "./metrics.ts";
import type {
  CampaignAudienceRollup,
  CampaignMetricGroup,
  CampaignPotentialGroup,
  CampaignSimInput,
  CampaignSimResult,
  MetricKind,
  PointIntelligence,
} from "./types.ts";

export * from "./types.ts";
export {
  metricConfidenceTier,
  metricMonthlyLabel,
  metricNoun,
  environmentLabelFor,
} from "./metrics.ts";
export {
  estimateLedCampaignImpacts,
  getLedPointIntelligence,
  ledCampaignModels,
  LED_CAMPAIGN_MISSING_VARIABLE,
} from "./led.ts";
export {
  estimateUpaScreenImpressions,
  getUpaScreenPointIntelligence,
  UPA_SCREEN_MODEL,
  UPA_SCREEN_MULTIPLIER,
} from "./screen.ts";
export {
  estimateTerminalScreenImpressions,
  getTerminalScreenPointIntelligence,
  TERMINAL_SCREEN_MODEL,
  TERMINAL_SCREEN_MULTIPLIER,
} from "./terminal-screen.ts";
export { modeledTier } from "./metrics.ts";

/** Tipos de métrica que representam impacto/oportunidade de exposição (medido ou modelado). */
const IMPACT_METRIC_KINDS = new Set<MetricKind>(["audited_impacts", "modeled_impressions"]);

/**
 * Dispatcher por tipo de mídia escolhido no ponto.
 *  - `led`    → Painel LED (impactos auditados Datavision).
 *  - `screen` → Tela: estratégia UPA (modelo sobre procedimentos) OU
 *               terminal/rodoviária (impacto medido se houver, senão modelo
 *               sobre fluxo de passageiros).
 *  - `wifi`   → ainda não implementada.
 *
 * Se o ponto tiver `led` e `screen` selecionados, o Painel LED tem prioridade
 * (métrica medida). Trocar a mídia do ponto para `wifi` remove qualquer
 * inteligência (retorna `null`).
 */
export function getPointIntelligence(
  slug: string,
  selectedMedia: MediaTypeKey[],
): PointIntelligence | null {
  if (selectedMedia.includes("led")) {
    const led = getLedPointIntelligence(slug);
    if (led) return led;
  }
  if (selectedMedia.includes("screen")) {
    const screen = getUpaScreenPointIntelligence(slug) ?? getTerminalScreenPointIntelligence(slug);
    if (screen) return screen;
  }
  // TODO(fase WiFi Ads): estratégia específica de `wifi`.
  return null;
}

/**
 * Consolida os pontos com inteligência de audiência (LED e/ou Tela) numa
 * visão de campanha. Só agrega o que é metodologicamente compatível:
 * métricas mensais são somadas APENAS dentro do mesmo tipo (`metricGroups`) —
 * impactos auditados, impactos potenciais modelados, fluxo e procedimentos
 * NUNCA se misturam. Rendas só viram faixa quando todos os pontos com renda
 * usam o mesmo tipo.
 */
export function rollupCampaignAudience(
  points: { slug: string; name: string; intelligence: PointIntelligence }[],
): CampaignAudienceRollup {
  const groupsByType = new Map<MetricKind, CampaignMetricGroup>();
  const environments: string[] = [];
  const ages: number[] = [];
  const female: number[] = [];
  const male: number[] = [];
  const incomes: { value: number; type: IncomeType }[] = [];

  for (const { name, intelligence } of points) {
    const m = intelligence.monthly;
    if (m) {
      const existing = groupsByType.get(m.metricType);
      if (existing) {
        existing.total += m.value;
        existing.tier = worstTier(existing.tier, m.tier);
        existing.pointCount += 1;
        existing.pointNames.push(name);
      } else {
        groupsByType.set(m.metricType, {
          metricType: m.metricType,
          label: m.label,
          noun: m.noun,
          total: m.value,
          tier: m.tier,
          pointCount: 1,
          pointNames: [name],
        });
      }
    }

    if (!environments.includes(intelligence.environmentLabel)) {
      environments.push(intelligence.environmentLabel);
    }

    const d = intelligence.demographics;
    if (d?.averageAge != null) ages.push(d.averageAge);
    if (d?.genderFemalePercent != null) female.push(d.genderFemalePercent);
    if (d?.genderMalePercent != null) male.push(d.genderMalePercent);
    if (d?.income) incomes.push({ value: d.income.value, type: d.income.type });
  }

  const mean = (xs: number[]) => xs.reduce((sum, x) => sum + x, 0) / xs.length;

  const incomeTypes = new Set(incomes.map((i) => i.type));
  const sameIncomeType = incomes.length > 0 && incomeTypes.size === 1;
  const incomeType = sameIncomeType ? incomes[0].type : undefined;

  const metricGroups = [...groupsByType.values()];
  const impactGroups = metricGroups.filter((g) => IMPACT_METRIC_KINDS.has(g.metricType));
  const impactKinds = new Set(impactGroups.map((g) => g.metricType));

  return {
    ledPointCount: points.length,
    points,
    metricGroups,
    environments,
    environmentsLabel: environments.join(" + "),
    averageAge: ages.length > 0 ? Math.round(mean(ages) * 10) / 10 : undefined,
    gender:
      female.length > 0 && male.length > 0
        ? {
            femalePercent: Math.round(mean(female) * 10) / 10,
            malePercent: Math.round(mean(male) * 10) / 10,
          }
        : undefined,
    income:
      incomeType != null
        ? {
            min: Math.min(...incomes.map((i) => i.value)),
            max: Math.max(...incomes.map((i) => i.value)),
            type: incomeType,
            label: INCOME_LABEL[incomeType],
          }
        : undefined,
    incomeTypesMixed: incomeTypes.size > 1,
    impactPotentialTotal:
      impactGroups.length > 0 ? impactGroups.reduce((sum, g) => sum + g.total, 0) : undefined,
    impactPotentialMixed: impactKinds.size > 1,
  };
}

export const SIM_LIMITS = {
  days: { min: 1, max: 365, default: 15 },
  insertionsPerDay: { min: 1, max: 1000, default: 120 },
} as const;

function clampInt(raw: unknown, min: number, max: number, fallback: number): number {
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim() !== ""
        ? Number(raw)
        : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

/** Normaliza a entrada do simulador para inteiros dentro dos limites. */
export function clampSimInput(raw: Partial<CampaignSimInput> | null | undefined): CampaignSimInput {
  return {
    days: clampInt(raw?.days, SIM_LIMITS.days.min, SIM_LIMITS.days.max, SIM_LIMITS.days.default),
    insertionsPerDay: clampInt(
      raw?.insertionsPerDay,
      SIM_LIMITS.insertionsPerDay.min,
      SIM_LIMITS.insertionsPerDay.max,
      SIM_LIMITS.insertionsPerDay.default,
    ),
  };
}

/**
 * Simulação de campanha a partir do rollup + duração/inserções.
 *
 * - `totalInsertions` = days × insertionsPerDay (sempre).
 * - `potentialGroups`: um bloco por TIPO de métrica (nunca somados entre si),
 *   cada um com potencial mensal, média diária de referência (÷30) e
 *   potencial na janela (× days/30 — potencial de EXPOSIÇÃO do ambiente, não
 *   a entrega da campanha).
 * - `campaignImpacts` só é preenchido quando TODOS os pontos têm modelo de
 *   share de exibição (`ledCampaignModels`). Nesta fase nenhum tem — nem LED
 *   nem Tela: o projeto não publica loop/spot/SOV/inventário diário —
 *   → `null` + `missingVariable`.
 */
export function simulateCampaign(
  rollup: CampaignAudienceRollup,
  input: CampaignSimInput,
): CampaignSimResult {
  const { days, insertionsPerDay } = clampSimInput(input);
  const totalInsertions = days * insertionsPerDay;

  const potentialGroups: CampaignPotentialGroup[] = rollup.metricGroups.map((g) => ({
    metricType: g.metricType,
    label: g.label,
    noun: g.noun,
    tier: g.tier,
    pointCount: g.pointCount,
    monthly: g.total,
    dailyReference: Math.round(g.total / 30),
    windowPotential: Math.round(g.total * (days / 30)),
  }));

  const impactWindowGroups = potentialGroups.filter((g) => IMPACT_METRIC_KINDS.has(g.metricType));
  const combinedImpactWindow =
    impactWindowGroups.length > 0
      ? impactWindowGroups.reduce((sum, g) => sum + g.windowPotential, 0)
      : null;

  let campaignImpacts: number | null = null;
  let missingVariable: string | null = null;

  if (potentialGroups.length > 0 && rollup.points.length > 0) {
    let sum = 0;
    let allModelled = true;
    for (const { slug, intelligence } of rollup.points) {
      if (!intelligence.monthly) continue;
      const est = estimateLedCampaignImpacts({
        monthlyImpacts: intelligence.monthly.value,
        days,
        insertionsPerDay,
        model: ledCampaignModels[slug],
      });
      if (est.value == null) {
        allModelled = false;
        missingVariable = est.missingVariable;
        break;
      }
      sum += est.value;
    }
    if (allModelled) {
      campaignImpacts = sum;
      missingVariable = null;
    }
  }

  return {
    days,
    insertionsPerDay,
    totalInsertions,
    potentialGroups,
    combinedImpactWindow,
    combinesMeasuredAndModeled: rollup.impactPotentialMixed,
    campaignImpacts,
    missingVariable,
  };
}

const BR_NUMBER = new Intl.NumberFormat("pt-BR");

/** Formata um inteiro no padrão pt-BR (2.167.660). */
export function formatCount(value: number): string {
  return BR_NUMBER.format(Math.round(value));
}

const BR_COMPACT = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 0,
});

/** Formato compacto para números de destaque estimados ("143 mil", "1 mi"). */
export function formatCompact(value: number): string {
  return BR_COMPACT.format(Math.round(value));
}

const BR_CURRENCY = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return BR_CURRENCY.format(value);
}
