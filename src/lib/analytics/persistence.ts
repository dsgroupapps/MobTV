import "@tanstack/react-start/server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";
import type { FunnelEventPayload, PointEventPayload } from "./types";

export type AnalyticsEventRow = Database["public"]["Tables"]["analytics_events"]["Insert"];

/**
 * Camada de mapeamento/persistência dos eventos que HOJE já chegam
 * corretamente a `server.ts` (validados pelo `.validator()` de cada server
 * function). Nada aqui decide QUANDO um evento dispara — isso continua em
 * `client.ts`/`funnel.ts`/nos componentes consumidores, sem mudança.
 */

const MAX_TEXT_LENGTH = 500;
const MAX_REFERRER_LENGTH = 1000;
const MAX_LANDING_PATH_LENGTH = 1000;
const MAX_TIMEZONE_LENGTH = 100;
const MAX_LANGUAGE_LENGTH = 35;
const MAX_COUNTRY_CODE_LENGTH = 10;
const MAX_METADATA_BYTES = 4096;

/** `undefined`/vazio vira `null` (coluna opcional); string sempre cortada em `max` para nunca depender de um CHECK de banco para isso. */
function truncate(value: string | undefined | null, max = MAX_TEXT_LENGTH): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

/** "390x844" -> { width: 390, height: 844 }. Formato inválido/ausente vira null nos dois — nunca inventa um valor. */
function parseDimensions(value: string | undefined): {
  width: number | null;
  height: number | null;
} {
  if (!value) return { width: null, height: null };
  const match = /^(\d{1,5})x(\d{1,5})$/.exec(value.trim());
  if (!match) return { width: null, height: null };
  return { width: Number(match[1]), height: Number(match[2]) };
}

function clampScrollDepth(value: number | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Monta `metadata` só com campos JÁ TIPADOS e conhecidos como seguros —
 * nunca um passthrough do payload recebido do cliente. Por isso não existe
 * uma superfície de "payload arbitrário" para filtrar: o que entra aqui é
 * sempre um subconjunto fixo, decidido neste arquivo. O corte por tamanho
 * abaixo é só um cinto de segurança adicional, não a defesa principal.
 */
function safeMetadata(input: Record<string, Json | undefined>): Json {
  const cleaned: Record<string, Json> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") continue;
    cleaned[key] = value;
  }

  if (JSON.stringify(cleaned).length > MAX_METADATA_BYTES) {
    return { _truncated: true, _originalKeys: Object.keys(cleaned) };
  }
  return cleaned;
}

export function mapPointEventToRow(
  payload: PointEventPayload,
  extra: { countryCode?: string } = {},
): AnalyticsEventRow {
  const viewport = parseDimensions(payload.viewport);
  const screen = parseDimensions(payload.screen);

  return {
    event_name: payload.event,
    event_domain: "point",

    visitor_id: payload.visitorId,
    session_id: payload.sessionId,

    source: truncate(payload.source),
    initial_point_slug: null, // conceito de funil; evento de ponto não tem "inicial" separado do próprio ponto
    point_slug: truncate(payload.pointId),
    qr_id: null, // PointContext não carrega qr_id — só a atribuição de funil (captureFirstTouch)
    landing_path: null, // PointEventPayload não carrega landing path

    category_key: truncate(payload.categoryKey),
    media_type: null,
    planning_intent: null,

    device_type: payload.deviceCategory,
    os: truncate(payload.os),
    browser: truncate(payload.browser),
    language: truncate(payload.language, MAX_LANGUAGE_LENGTH),
    timezone: truncate(payload.timezone, MAX_TIMEZONE_LENGTH),

    viewport_width: viewport.width,
    viewport_height: viewport.height,
    screen_width: screen.width,
    screen_height: screen.height,

    referrer: truncate(payload.referrer, MAX_REFERRER_LENGTH),

    utm_source: truncate(payload.utm?.utm_source),
    utm_medium: truncate(payload.utm?.utm_medium),
    utm_campaign: truncate(payload.utm?.utm_campaign),
    utm_term: truncate(payload.utm?.utm_term),
    utm_content: truncate(payload.utm?.utm_content),

    scroll_depth_percent: clampScrollDepth(payload.scrollDepthPercent),
    country_code: truncate(extra.countryCode, MAX_COUNTRY_CODE_LENGTH),

    metadata: safeMetadata({
      pointName: payload.pointName,
      assetId: payload.assetId,
      isFirstVisit: payload.isFirstVisit,
      msSincePageLoad: payload.msSincePageLoad,
      clientTimestamp: payload.timestamp,
    }),
  };
}

export function mapFunnelEventToRow(
  payload: FunnelEventPayload,
  extra: { countryCode?: string } = {},
): AnalyticsEventRow {
  const viewport = parseDimensions(payload.viewport);
  const screen = parseDimensions(payload.screen);

  return {
    event_name: payload.event,
    event_domain: "funnel",

    visitor_id: payload.visitorId,
    session_id: payload.anonymousSessionId,

    source: truncate(payload.source),
    initial_point_slug: truncate(payload.initialPointSlug),
    point_slug: truncate(payload.pointSlug),
    qr_id: truncate(payload.qrId),
    landing_path: truncate(payload.landingPath, MAX_LANDING_PATH_LENGTH),

    category_key: truncate(payload.categoryKey),
    media_type: truncate(payload.mediaType),
    planning_intent: truncate(payload.planningIntent),

    device_type: payload.deviceCategory,
    os: truncate(payload.os),
    browser: truncate(payload.browser),
    language: truncate(payload.language, MAX_LANGUAGE_LENGTH),
    timezone: truncate(payload.timezone, MAX_TIMEZONE_LENGTH),

    viewport_width: viewport.width,
    viewport_height: viewport.height,
    screen_width: screen.width,
    screen_height: screen.height,

    referrer: truncate(payload.referrer, MAX_REFERRER_LENGTH),

    // FunnelEventPayload não carrega UTM hoje (só os eventos de ponto
    // carregam) — não inventar aqui; fica para outro bloco.
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,

    scroll_depth_percent: null, // não existe em eventos de funil
    country_code: truncate(extra.countryCode, MAX_COUNTRY_CODE_LENGTH),

    metadata: safeMetadata({
      firstTouchAt: payload.firstTouchAt,
      currentPath: payload.currentPath,
      clientTimestamp: payload.timestamp,
    }),
  };
}

export type InsertAnalyticsEventResult = { ok: true } | { ok: false; reason: string };

/**
 * Grava UMA linha em `analytics_events`. Nunca lança — falha de rede/RLS/
 * config vira `{ ok: false }` e um `console.error` estruturado para
 * diagnóstico; quem chama (server.ts) segue a resposta HTTP normalmente.
 * Tracking é best-effort: uma falha aqui nunca pode derrubar a experiência
 * pública.
 */
export async function insertAnalyticsEvent(
  client: SupabaseClient<Database> | undefined,
  row: AnalyticsEventRow,
): Promise<InsertAnalyticsEventResult> {
  if (!client) {
    console.error(
      JSON.stringify({
        kind: "analytics_event_insert_skipped",
        reason: "supabase_not_configured",
        event_name: row.event_name,
        event_domain: row.event_domain,
      }),
    );
    return { ok: false, reason: "supabase_not_configured" };
  }

  try {
    const { error } = await client.from("analytics_events").insert(row);
    if (error) {
      console.error(
        JSON.stringify({
          kind: "analytics_event_insert_failed",
          event_name: row.event_name,
          event_domain: row.event_domain,
          message: error.message,
          code: error.code,
        }),
      );
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  } catch (error) {
    console.error(
      JSON.stringify({
        kind: "analytics_event_insert_threw",
        event_name: row.event_name,
        event_domain: row.event_domain,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    return { ok: false, reason: "unexpected_error" };
  }
}
