import {
  formatCount,
  WIFI_METRIC_LABELS,
  WIFI_MISSING_LABEL,
  WIFI_MISSING_NOTE,
} from "@/lib/planner/audience";
import type { PlannerPointDetails } from "@/lib/planner/selection";
import { PointAudiencePanel } from "./PointAudiencePanel";

/** Cada serviço mantém seu estado: a ausência de WiFi nunca substitui DOOH. */
export function PlannerPointAudience({
  point,
  dense = false,
}: {
  point: PlannerPointDetails;
  dense?: boolean;
}) {
  return (
    <div className="space-y-3" data-service-audience>
      {point.dooh && (
        <PointAudiencePanel intelligence={point.dooh} pointName={point.name} dense={dense} />
      )}
      {!point.dooh && point.media.some((media) => media !== "wifi") && (
        <p className="text-sm text-white/60">
          DOOH: dados individuais de audiência em atualização. Os serviços selecionados podem ser
          incluídos na proposta.
        </p>
      )}
      {point.wifi && (
        <div data-wifi-audience className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="text-sm font-semibold text-white">WiFi Ads</h4>
          {point.wifi.status === "missing" ? (
            <>
              <p className="mt-2 text-sm text-white/70">{WIFI_MISSING_LABEL}.</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">{WIFI_MISSING_NOTE}</p>
            </>
          ) : (
            point.wifi.metrics.map((metric) => (
              <div
                key={`${metric.metricType}-${metric.period}`}
                className="mt-2 text-sm text-white/70"
              >
                <p>
                  {WIFI_METRIC_LABELS[metric.metricType]}: {formatCount(metric.value)} {metric.unit}
                </p>
                <p className="text-xs text-white/45">
                  {metric.source} · {metric.period}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
