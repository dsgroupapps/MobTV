import type { AnalyticsEventRecord } from "./types.ts";

/**
 * Helpers de fixture para os testes de `reporting/` — não é um arquivo de
 * teste em si (sem `test()`), só builders pequenos e legíveis para montar
 * `AnalyticsEventRecord` sem repetir os ~30 campos em cada caso.
 */

let sequence = 0;
function nextId(): string {
  sequence += 1;
  return `row-${sequence}`;
}

const BASE_TIME = Date.parse("2026-09-08T12:00:00.000Z");

export function row(overrides: Partial<AnalyticsEventRecord> = {}): AnalyticsEventRecord {
  return {
    id: nextId(),
    created_at: new Date(BASE_TIME + sequence * 1000).toISOString(),
    event_name: "point_view",
    event_domain: "funnel",
    visitor_id: "visitor-1",
    session_id: "session-1",
    source: null,
    initial_point_slug: null,
    point_slug: null,
    qr_id: null,
    landing_path: null,
    category_key: null,
    media_type: null,
    planning_intent: null,
    device_type: "mobile",
    os: "Android",
    browser: "Chrome",
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
    viewport_width: 390,
    viewport_height: 844,
    screen_width: 390,
    screen_height: 844,
    referrer: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    scroll_depth_percent: null,
    country_code: "BR",
    metadata: {},
    ...overrides,
  };
}

/**
 * Uma "jornada" QR completa: qr_landing -> point_view -> site_continue ->
 * planner_open -> planner_start -> planner_point_add -> planner_media_select
 * -> planner_summary_view -> planner_submit, todas na MESMA sessão/visitante,
 * com a mesma atribuição de origem (source/initial_point_slug) — como o
 * código real garante via sessionStorage (ver session.ts).
 */
export function qrJourney(options: {
  sessionId: string;
  visitorId?: string;
  pointSlug: string;
  device?: Partial<Pick<AnalyticsEventRecord, "device_type" | "os" | "browser">>;
  upToStep?: number; // corta a jornada nas primeiras N etapas (default: todas as 9)
  createdAtBase?: number; // epoch ms
}): AnalyticsEventRecord[] {
  const visitorId = options.visitorId ?? `visitor-of-${options.sessionId}`;
  const common: Partial<AnalyticsEventRecord> = {
    session_id: options.sessionId,
    visitor_id: visitorId,
    source: "qr",
    initial_point_slug: options.pointSlug,
    landing_path: `/ponto/${options.pointSlug}?src=qr`,
    device_type: options.device?.device_type ?? "mobile",
    os: options.device?.os ?? "Android",
    browser: options.device?.browser ?? "Chrome",
  };

  const steps: Array<Partial<AnalyticsEventRecord>> = [
    { event_name: "qr_landing", point_slug: options.pointSlug },
    { event_name: "point_view", point_slug: options.pointSlug },
    { event_name: "site_continue" },
    { event_name: "planner_open" },
    { event_name: "planner_start" },
    { event_name: "planner_point_add", point_slug: options.pointSlug },
    { event_name: "planner_media_select", point_slug: options.pointSlug, media_type: "panel_led" },
    { event_name: "planner_summary_view" },
    { event_name: "planner_submit" },
  ];

  const base = options.createdAtBase ?? BASE_TIME;
  const limit = options.upToStep ?? steps.length;

  return steps.slice(0, limit).map((step, index) =>
    row({
      ...common,
      ...step,
      created_at: new Date(base + index * 60_000).toISOString(),
    }),
  );
}
