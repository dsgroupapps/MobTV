import { pointMediaTypes, type MediaTypeKey } from "../../data/network-points.ts";
import { regionSummaries } from "../../data/df-regions.ts";
import type { PlannerSelection } from "../../data/planner-options.ts";
import { findPointBySlug } from "../point-slug.ts";
import {
  getPointIntelligence,
  getWifiPointIntelligence,
  rollupCampaignAudience,
} from "./audience/index.ts";

export const PLANNER_MEDIA_LABELS: Record<MediaTypeKey, string> = {
  led: "Painel LED",
  screen: "Tela",
  wifi: "WiFi Ads",
};

/** A seleção existe antes do enriquecimento de audiência, inclusive sem métricas. */
export function getPlannerSelectionDetails(selections: PlannerSelection[]) {
  return selections.flatMap((selection) => {
    const found = findPointBySlug(selection.slug);
    if (!found) return [];
    const offered = pointMediaTypes(found.point);
    const media = [...new Set(selection.media.filter((m) => offered.includes(m)))];
    if (media.length === 0) return [];
    return [
      {
        slug: found.point.slug,
        name: found.point.nome,
        region: regionSummaries.find((region) => region.pointNames.includes(found.point.nome))
          ?.region,
        media,
        dooh: getPointIntelligence(selection.slug, media),
        wifi: media.includes("wifi") ? getWifiPointIntelligence(selection.slug) : null,
      },
    ];
  });
}

export type PlannerPointDetails = ReturnType<typeof getPlannerSelectionDetails>[number];

export function rollupPlannerSelection(points: PlannerPointDetails[]) {
  return rollupCampaignAudience(
    points.flatMap((point) =>
      point.dooh ? [{ slug: point.slug, name: point.name, intelligence: point.dooh }] : [],
    ),
  );
}

export function selectionHasDooh(points: PlannerPointDetails[]) {
  return points.some((point) => point.media.some((media) => media === "led" || media === "screen"));
}
