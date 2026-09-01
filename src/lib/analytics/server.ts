import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import {
  FUNNEL_EVENT_NAMES,
  POINT_EVENT_NAMES,
  type FunnelEventPayload,
  type PointEventPayload,
} from "./types";

/** País aproximado resolvido na borda da Cloudflare — nunca o IP. */
function readApproxCountry(): string | undefined {
  try {
    return getRequestHeader("cf-ipcountry" as never) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Sumidouro server-side dos eventos de perfil de ponto.
 *
 * ESTADO ATUAL (ver relatório da tarefa para o detalhe completo): este
 * projeto roda como Cloudflare Worker sem nenhum binding de persistência
 * (sem KV, D1, R2 ou Durable Objects configurado) e sem SDK de analytics de
 * terceiros instalado. Por isso, o que esta função faz HOJE é validar o
 * payload e emitir uma linha de log estruturada (`console.log`) — visível
 * via `wrangler tail`/painel de logs do Worker em produção. Isso já tira a
 * captura do cliente (não fica preso a localStorage) e prova a arquitetura
 * ponta a ponta, mas NÃO é uma base consultável — não dá para responder
 * "quantos cliques teve o ponto X essa semana" sem persistência real.
 *
 * Para virar analytics consultável, sem trocar a arquitetura acima, falta
 * só UM passo: trocar o `console.log` abaixo por uma escrita numa das
 * opções (nenhuma delas exige serviço pago para o volume de uma página de
 * perfil por QR Code):
 *   - Cloudflare KV/D1 — adicionar o binding no wrangler config e trocar
 *     este `console.log` por `env.DB.insert(...)`/`env.KV.put(...)`;
 *   - Cloudflare Workers Analytics Engine — feito sob medida para esse tipo
 *     de evento de alto volume, sem schema prévio;
 *   - Encaminhar o payload já validado para um serviço externo (ex.
 *     PostHog/Plausible) via fetch, se a MOBTV preferir não manter infra própria.
 *
 * Deliberadamente NUNCA lemos/persistimos o IP do visitante aqui — só o
 * país aproximado (`CF-IPCountry`, cabeçalho padrão da Cloudflare quando a
 * geolocalização por IP está ativa na zona), que não é considerado dado
 * pessoal isolado. Nenhum identificador é derivado de IP.
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
    // Cabeçalho padrão da Cloudflare — não é o IP, só o país resolvido por ele
    // na borda. Ausente em ambientes fora da Cloudflare (ex. `vite dev` local).
    console.log(
      JSON.stringify({
        kind: "point_analytics_event",
        ...data,
        approxCountry: readApproxCountry(),
        receivedAt: new Date().toISOString(),
      }),
    );

    return { ok: true } as const;
  });

/**
 * Sumidouro server-side dos eventos de FUNIL (jornada QR → site → planejador
 * → CTA). Mesma arquitetura do `trackPointEvent`: valida o payload e emite
 * uma linha de log estruturada (`kind: "funnel_analytics_event"`). Sem IP,
 * sem PII — só o país aproximado da borda. A persistência consultável
 * continua sendo o próximo passo documentado (KV/D1/Analytics Engine),
 * fora do escopo desta fase ("sem dashboard analytics").
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
    console.log(
      JSON.stringify({
        kind: "funnel_analytics_event",
        ...data,
        approxCountry: readApproxCountry(),
        receivedAt: new Date().toISOString(),
      }),
    );

    return { ok: true } as const;
  });
