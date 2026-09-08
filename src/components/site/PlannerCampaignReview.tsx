import type { CampaignSimInput } from "@/lib/planner/audience";
import {
  rollupPlannerSelection,
  selectionHasDooh,
  type PlannerPointDetails,
} from "@/lib/planner/selection";
import { CampaignAudienceSummary } from "./CampaignAudienceSummary";
import { CampaignConfiguration } from "./CampaignConfiguration";
import { MediaTypeChips } from "./MediaBadges";
import { PlannerPointAudience } from "./PlannerPointAudience";

export function PlannerCampaignReview({
  points,
  sim,
  onSimChange,
}: {
  points: PlannerPointDetails[];
  sim: CampaignSimInput;
  onSimChange: (next: CampaignSimInput) => void;
}) {
  const rollup = rollupPlannerSelection(points);
  return (
    <div className="space-y-6">
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {points.map((point) => (
          <article
            key={point.slug}
            data-summary-item
            data-point-slug={point.slug}
            data-point-name={point.name}
            data-selected-media={point.media.join(",")}
            className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
          >
            <div>
              <h3 className="font-display text-lg font-bold text-white">{point.name}</h3>
              {point.region && <p className="mt-1 text-xs text-white/50">{point.region}</p>}
              <div className="mt-2">
                <MediaTypeChips types={point.media} />
              </div>
            </div>
            <PlannerPointAudience point={point} dense />
          </article>
        ))}
      </div>
      <CampaignConfiguration
        sim={sim}
        onSimChange={onSimChange}
        hasDooh={selectionHasDooh(points)}
      />
      {rollup.points.length > 0 ? (
        <CampaignAudienceSummary rollup={rollup} sim={sim} />
      ) : (
        <p data-campaign-audience className="text-sm text-white/60">
          Resumo de audiência da seleção: dados individuais em atualização. Todos os pontos e
          serviços escolhidos seguem na proposta.
        </p>
      )}
      {points.some((point) => point.wifi?.status === "missing") && rollup.points.length > 0 && (
        <p className="text-xs text-white/50">
          WiFi Ads permanece na seleção, sem contribuição numérica para os totais de audiência
          enquanto os dados individuais estão em atualização.
        </p>
      )}
    </div>
  );
}
