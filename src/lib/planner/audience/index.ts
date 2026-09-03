import type { MediaTypeKey } from "../../../data/network-points.ts";
import type { IncomeType, MetricType } from "../../../data/point-audience-data.ts";
import { estimateLedCampaignImpacts, getLedPointIntelligence, ledCampaignModels } from "./led.ts";
import type {
  AudienceConfidenceTier,
  CampaignAudienceRollup,
  CampaignMetricGroup,
  CampaignSimInput,
  CampaignSimResult,
  LedPointIntelligence,
} from "./types.ts";

export * from "./types.ts";
export {
  estimateLedCampaignImpacts,
  getLedPointIntelligence,
  ledCampaignModels,
  metricConfidenceTier,
  metricMonthlyLabel,
  metricNoun,
  LED_CAMPAIGN_MISSING_VARIABLE,
} from "./led.ts";

/**
 * Dispatcher por tipo de mídia. Hoje só `Painel LED` tem estratégia; `screen`
 * (Tela) e `wifi` (WiFi Ads) ficam preparados mas retornam `null` — a
 * assinatura já aceita a lista de mídias escolhidas no ponto para quando
 * cada uma ganhar sua própria camada de cálculo.
 */
export function getPointIntelligence(
  slug: string,
  selectedMedia: MediaTypeKey[],
): LedPointIntelligence | null {
  if (selectedMedia.includes("led")) {
    return getLedPointIntelligence(slug);
  }
  // TODO(fase Tela / WiFi): estratégias específicas de `screen` e `wifi`.
  return null;
}

const TIER_RANK: Record<AudienceConfidenceTier, number> = {
  measured: 3,
  derived: 2,
  estimated: 1,
};

/** Menor (pior) nível de confiança entre dois. */
function worstTier(a: AudienceConfidenceTier, b: AudienceConfidenceTier): AudienceConfidenceTier {
  return TIER_RANK[a] <= TIER_RANK[b] ? a : b;
}

const INCOME_LABEL: Record<IncomeType, string> = {
  domiciliar: "Renda média domiciliar",
  familiar: "Renda média familiar",
  per_capita: "Renda per capita",
};

/**
 * Consolida os pontos com `Painel LED` da seleção numa visão de campanha.
 * Só agrega o que é metodologicamente compatível: métricas mensais são
 * somadas APENAS dentro do mesmo tipo (`metricGroups`); rendas só viram
 * faixa quando todos os pontos usam o mesmo tipo de renda.
 */
export function rollupCampaignAudience(
  points: { slug: string; name: string; intelligence: LedPointIntelligence }[],
): CampaignAudienceRollup {
  const groupsByType = new Map<MetricType, CampaignMetricGroup>();
  const environments: string[] = [];
  const ages: number[] = [];
  const female: number[] = [];
  const male: number[] = [];
  const incomes: { value: number; type: IncomeType }[] = [];

  for (const { name, intelligence } of points) {
    const m = intelligence.monthly;
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

  return {
    ledPointCount: points.length,
    points,
    metricGroups: [...groupsByType.values()],
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
 * Calcula a simulação de campanha a partir do rollup + duração/inserções.
 *
 * - `totalInsertions` = days × insertionsPerDay (sempre).
 * - `monthlyEnvironmentPotential` / `dailyReference` / `windowEnvironmentPotential`
 *   só existem quando há um grupo de `audited_impacts` (impactos auditados).
 * - `campaignImpacts` só é preenchido se TODOS os pontos LED têm modelo de
 *   share de exibição (`ledCampaignModels`). Nesta fase nenhum tem → `null` +
 *   `missingVariable`.
 */
export function simulateCampaign(
  rollup: CampaignAudienceRollup,
  input: CampaignSimInput,
): CampaignSimResult {
  const { days, insertionsPerDay } = clampSimInput(input);
  const totalInsertions = days * insertionsPerDay;

  const impactsGroup = rollup.metricGroups.find((g) => g.metricType === "audited_impacts");
  const monthly = impactsGroup?.total ?? null;

  let campaignImpacts: number | null = null;
  let missingVariable: string | null = null;

  if (monthly != null && rollup.points.length > 0) {
    let sum = 0;
    let allModelled = true;
    for (const { slug, intelligence } of rollup.points) {
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
    monthlyEnvironmentPotential: monthly,
    dailyReference: monthly != null ? Math.round(monthly / 30) : null,
    windowEnvironmentPotential: monthly != null ? Math.round(monthly * (days / 30)) : null,
    campaignImpacts,
    missingVariable,
  };
}

const BR_NUMBER = new Intl.NumberFormat("pt-BR");

/** Formata um inteiro no padrão pt-BR (2.167.660). */
export function formatCount(value: number): string {
  return BR_NUMBER.format(Math.round(value));
}

const BR_CURRENCY = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return BR_CURRENCY.format(value);
}
