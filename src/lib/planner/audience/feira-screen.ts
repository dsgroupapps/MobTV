import { pointMediaTypes } from "../../../data/network-points.ts";
import { getPointAudienceData } from "../../../data/point-audience-data.ts";
import { findPointBySlug } from "../../point-slug.ts";
import { INCOME_LABEL, metricConfidenceTier } from "./metrics.ts";
import type { PointIntelligence } from "./types.ts";

/** Base parcial existente: não há modelo de exposição para converter visitantes. */
export function getFeiraScreenPointIntelligence(slug: string): PointIntelligence | null {
  const found = findPointBySlug(slug);
  const data = getPointAudienceData(slug);
  if (
    !found ||
    !pointMediaTypes(found.point).includes("screen") ||
    data?.researchCategory !== "Feira"
  )
    return null;
  const flow = data.metrics.find((metric) => metric.type === "estimated_visitors");
  return {
    slug,
    mediaType: "screen",
    researchCategory: data.researchCategory,
    environmentLabel: "Feira",
    referenceArea: data.referenceArea,
    baseMetric: flow
      ? {
          value: flow.value,
          metricType: flow.type,
          label: "Fluxo estimado de visitantes/mês",
          noun: "visitantes",
          source: flow.source,
          period: "Sem ano-base confirmado",
          sourceQuality: flow.sourceQuality,
          tier: metricConfidenceTier(flow),
          estimated: flow.estimated,
          caveat:
            "Referência de aproximadamente 30.000 visitantes/semana × 4. Não é impacto medido nem contagem de pessoas únicas; não há modelo de exposição para esta base.",
        }
      : undefined,
    demographics: {
      averageAge: data.demographics?.averageAge,
      genderFemalePercent: data.demographics?.gender?.femalePercent,
      genderMalePercent: data.demographics?.gender?.malePercent,
      income: data.income
        ? {
            value: data.income.value,
            label: INCOME_LABEL[data.income.type],
            type: data.income.type,
            typeLabel: data.income.typeLabel,
          }
        : undefined,
    },
  };
}
