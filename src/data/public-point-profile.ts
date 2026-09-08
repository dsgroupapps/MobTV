import { getPrimaryMetric, type PointAudienceData } from "./point-audience-data.ts";
import type { AudienceProfile, PointInsights } from "./point-insights.ts";

/** Dados publicáveis: uma base real nunca é completada com conteúdo demonstrativo. */
export function publicPointProfile(data?: PointAudienceData, insights?: PointInsights) {
  const published = insights && !insights.isDemo && !data ? insights : undefined;
  const gender = data?.demographics?.gender;
  const audience: AudienceProfile | undefined = data
    ? gender && { femalePercent: gender.femalePercent, malePercent: gender.malePercent }
    : published?.audience;
  return {
    primaryMetric: data?.metrics.length ? getPrimaryMetric(data) : undefined,
    income: data?.income,
    monthlyAudience: published?.monthlyAudience,
    averageFamilyIncome: published?.averageFamilyIncome,
    audience,
  };
}
