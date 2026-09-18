import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import {
  FUNNEL_EVENT_NAMES,
  POINT_EVENT_NAMES,
  type FunnelEventPayload,
  type PointEventPayload,
} from "./types";
import { insertAnalyticsEvent, mapFunnelEventToRow, mapPointEventToRow } from "./persistence";
import { getAnalyticsSupabaseClient } from "./supabase";

/**
 * País aproximado via `CF-IPCountry` — nunca o IP. Esse cabeçalho só existe
 * se o tráfego passar por um proxy Cloudflare na frente do serviço (o
 * deploy em si é um Node server no Render, não um Cloudflare Worker); onde
 * não houver esse proxy, ou em `vite dev` local, isto fica sempre
 * `undefined` — comportamento esperado, não um bug.
 */
function readApproxCountry(): string | undefined {
  try {
    return getRequestHeader("cf-ipcountry" as never) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Sumidouro server-side dos eventos de perfil de ponto (QR Code).
 *
 * BLOCO A (persistência): valida o payload, mapeia para uma linha de
 * `analytics_events` (`src/lib/analytics/persistence.ts`) e insere via
 * Supabase — o mesmo projeto/credenciais que o resto do app já usa, com
 * RLS que permite só INSERT (ver
 * `supabase/migrations/20260917000000_create_analytics_events.sql`). O
 * `console.log` deixou de ser o destino principal; ele só roda se o INSERT
 * falhar, como log de diagnóstico (ver `insertAnalyticsEvent`).
 *
 * Deliberadamente NUNCA lemos/persistimos o IP do visitante aqui — só o
 * país aproximado (`CF-IPCountry`, ver `readApproxCountry`), que não é
 * considerado dado pessoal isolado. Nenhum identificador é derivado de IP.
 *
 * Tracking é best-effort: uma falha de INSERT (Supabase fora do ar, RLS mal
 * configurada etc.) nunca deve derrubar a página pública — por isso o
 * `handler` sempre responde `ok`, mesmo quando a gravação falhou.
 */
export const trackPointEvent = createServerFn({ method: "POST" })
  .validator((data: unknown): PointEventPayload => {
    if (typeof data !== "object" || data === null) throw new Error("invalid analytics payload");
    const payload = data as PointEventPayload;
    if (!POINT_EVENT_NAMES.includes(payload.event)) {
      throw new Error(`invalid analytics event: ${String((data as { event?: unknown }).event)}`);
    }
    return payload;
  })
  .handler(async ({ data }) => {
    const row = mapPointEventToRow(data, { countryCode: readApproxCountry() });
    const result = await insertAnalyticsEvent(getAnalyticsSupabaseClient(), row);
    return { ok: true, persisted: result.ok } as const;
  });

/**
 * Sumidouro server-side dos eventos de FUNIL (jornada QR → site → planejador
 * → CTA). Mesma arquitetura do `trackPointEvent`: valida, mapeia
 * (`mapFunnelEventToRow`) e insere na mesma tabela `analytics_events`
 * (`event_domain: "funnel"`). Sem IP, sem PII — só o país aproximado da
 * borda, quando disponível.
 */
export const trackFunnelEvent = createServerFn({ method: "POST" })
  .validator((data: unknown): FunnelEventPayload => {
    if (typeof data !== "object" || data === null) throw new Error("invalid funnel payload");
    const payload = data as FunnelEventPayload;
    if (!FUNNEL_EVENT_NAMES.includes(payload.event)) {
      throw new Error(`invalid funnel event: ${String((data as { event?: unknown }).event)}`);
    }
    if (typeof payload.anonymousSessionId !== "string" || payload.anonymousSessionId.length === 0) {
      throw new Error("missing anonymousSessionId");
    }
    return payload;
  })
  .handler(async ({ data }) => {
    const row = mapFunnelEventToRow(data, { countryCode: readApproxCountry() });
    const result = await insertAnalyticsEvent(getAnalyticsSupabaseClient(), row);
    return { ok: true, persisted: result.ok } as const;
  });
