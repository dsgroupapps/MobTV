import { pointMediaTypes } from "../../../data/network-points.ts";
import { findPointBySlug } from "../../point-slug.ts";

/** Métricas WiFi permanecem distintas de fluxo presencial e impactos DOOH. */
export type WifiMetricKind =
  | "wifi_accesses"
  | "sessions"
  | "new_users"
  | "active_users"
  | "views"
  | "engagements";

export type WifiPointMetric = {
  slug: string;
  metricType: WifiMetricKind;
  value: number;
  unit: string;
  period: string;
  source: string;
};

export type WifiPointIntelligence = { slug: string; mediaType: "wifi" } & (
  | { status: "missing"; metrics?: never }
  | { status: "available"; metrics: [WifiPointMetric, ...WifiPointMetric[]] }
);

export const WIFI_METRIC_LABELS: Record<WifiMetricKind, string> = {
  wifi_accesses: "Acessos WiFi",
  sessions: "Sessões WiFi",
  new_users: "Novos usuários WiFi",
  active_users: "Usuários ativos WiFi",
  views: "Visualizações WiFi",
  engagements: "Engajamentos WiFi",
};

export const WIFI_MISSING_LABEL = "Dados individuais de audiência em atualização";
export const WIFI_MISSING_NOTE =
  "Você pode incluir WiFi Ads na campanha e solicitar uma proposta mesmo sem uma métrica individual disponível para este ponto.";

// Não há métricas WiFi individuais cadastradas. Os agregados institucionais
// da rede não são distribuídos entre pontos. Futuras entradas exigem slug,
// tipo, valor, unidade, período e fonte próprios; nenhuma conversão para DOOH.
export function getWifiPointIntelligence(
  slug: string,
  pointMetrics: readonly WifiPointMetric[] = [],
): WifiPointIntelligence | null {
  const found = findPointBySlug(slug);
  if (!found || !pointMediaTypes(found.point).includes("wifi")) return null;
  const metrics = pointMetrics.filter(
    (metric) =>
      metric.slug === slug &&
      Object.hasOwn(WIFI_METRIC_LABELS, metric.metricType) &&
      Number.isFinite(metric.value) &&
      metric.value >= 0 &&
      [metric.unit, metric.period, metric.source].every(
        (text) => typeof text === "string" && text.trim().length > 0,
      ),
  );
  const [first, ...rest] = metrics;
  if (first) return { slug, mediaType: "wifi", status: "available", metrics: [first, ...rest] };
  return { slug, mediaType: "wifi", status: "missing" };
}
