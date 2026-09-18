import type { AnalyticsEventRecord, BreakdownEntry } from "./types.ts";

const UNKNOWN = "unknown";

/**
 * Um valor por SESSÃO, nunca por evento: para cada `session_id`, usa o
 * primeiro valor não nulo de `field` entre as linhas do escopo, ordenadas
 * por `created_at`. Sessões sem nenhum valor conhecido para essa dimensão
 * caem em `"unknown"` — nunca são descartadas silenciosamente, para os
 * percentuais sempre somarem ~100% das sessões do escopo.
 *
 * Decisão documentada: contar por sessão (não por evento) evita que uma
 * sessão que gerou muitos eventos (ex. scrollou bastante, clicou em vários
 * CTAs) pese mais de uma vez na distribuição de device/OS/browser — o peso
 * de cada visitante na distribuição é sempre 1, não proporcional ao quanto
 * ele interagiu.
 */
export function sessionBreakdown(
  rows: AnalyticsEventRecord[],
  field: (row: AnalyticsEventRecord) => string | null | undefined,
): BreakdownEntry[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const valueBySession = new Map<string, string>();
  for (const row of sorted) {
    if (valueBySession.has(row.session_id)) continue;
    const value = field(row);
    if (value) valueBySession.set(row.session_id, value);
  }

  // Sessões que nunca tiveram um valor não nulo em nenhuma linha do escopo.
  for (const row of rows) {
    if (!valueBySession.has(row.session_id)) valueBySession.set(row.session_id, UNKNOWN);
  }

  const counts = new Map<string, number>();
  for (const value of valueBySession.values()) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const total = valueBySession.size;
  return [...counts.entries()]
    .map(([value, sessions]) => ({
      value,
      sessions,
      pct: total > 0 ? (sessions / total) * 100 : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

/** device_type/os/browser vêm de TODAS as linhas do escopo (os dois domínios carregam DeviceContext em todo evento) — não restrito a um domínio. */
export function computeDeviceBreakdown(rows: AnalyticsEventRecord[]): BreakdownEntry[] {
  return sessionBreakdown(rows, (r) => r.device_type);
}
export function computeOsBreakdown(rows: AnalyticsEventRecord[]): BreakdownEntry[] {
  return sessionBreakdown(rows, (r) => r.os);
}
export function computeBrowserBreakdown(rows: AnalyticsEventRecord[]): BreakdownEntry[] {
  return sessionBreakdown(rows, (r) => r.browser);
}

/**
 * source/initial_point_slug/qr_id só fazem sentido em linhas de domínio
 * "funnel" — é onde a atribuição de first-touch é gravada de verdade (ver
 * `src/lib/analytics/persistence.ts`: eventos de ponto gravam
 * `initial_point_slug`/`qr_id` como `null`).
 */
export function computeSourceBreakdown(funnelRows: AnalyticsEventRecord[]): BreakdownEntry[] {
  return sessionBreakdown(funnelRows, (r) => r.source);
}
export function computeInitialPointSlugBreakdown(
  funnelRows: AnalyticsEventRecord[],
): BreakdownEntry[] {
  return sessionBreakdown(funnelRows, (r) => r.initial_point_slug);
}
export function computeQrIdBreakdown(funnelRows: AnalyticsEventRecord[]): BreakdownEntry[] {
  return sessionBreakdown(funnelRows, (r) => r.qr_id);
}

/**
 * LIMITAÇÃO DOCUMENTADA (não contornada): UTM só é gravado em eventos de
 * domínio "point" hoje — eventos de funil sempre têm `utm_* = null` (ver
 * `mapFunnelEventToRow` em `src/lib/analytics/persistence.ts`, que não
 * inventa UTM porque `FunnelEventPayload` não carrega esse dado). Por isso
 * este breakdown usa só linhas de PONTO, e reflete apenas sessões que
 * tiveram pelo menos um evento de ponto com UTM presente — não é o
 * first-touch de toda a sessão, é uma aproximação a partir do primeiro
 * evento de ponto disponível com esse dado.
 */
export function computeUtmSourceBreakdown(pointRows: AnalyticsEventRecord[]): BreakdownEntry[] {
  return sessionBreakdown(pointRows, (r) => r.utm_source);
}
export function computeUtmMediumBreakdown(pointRows: AnalyticsEventRecord[]): BreakdownEntry[] {
  return sessionBreakdown(pointRows, (r) => r.utm_medium);
}
export function computeUtmCampaignBreakdown(pointRows: AnalyticsEventRecord[]): BreakdownEntry[] {
  return sessionBreakdown(pointRows, (r) => r.utm_campaign);
}
