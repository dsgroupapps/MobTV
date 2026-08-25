import { getDeviceContext, getVisitorContext } from "./context";
import { trackPointEvent } from "./server";
import type { PointContext, PointEventName } from "./types";

/**
 * Cria um "tracker" já preso ao contexto de um ponto específico (slug, nome,
 * categoria, assetId/source/UTM lidos da URL) — os componentes da página só
 * chamam `track("point_whatsapp_click")` etc., sem repassar esse contexto
 * toda vez.
 *
 * Nunca lança/bloqueia a UI: falha de rede na captura de analytics não pode
 * impedir o clique no WhatsApp, por exemplo — por isso o catch silencioso.
 */
export function createPointTracker(pointContext: PointContext) {
  const pageLoadedAt = typeof performance !== "undefined" ? performance.now() : 0;

  function track(event: PointEventName, extra?: { scrollDepthPercent?: number }) {
    if (typeof window === "undefined") return;

    const payload = {
      ...pointContext,
      ...getDeviceContext(),
      ...getVisitorContext(),
      event,
      timestamp: new Date().toISOString(),
      msSincePageLoad:
        typeof performance !== "undefined" ? Math.round(performance.now() - pageLoadedAt) : undefined,
      ...extra,
    };

    trackPointEvent({ data: payload }).catch(() => {
      // Analytics nunca deve quebrar a experiência do usuário — falha aqui é
      // só perda de um evento, não um erro que valha interromper a página.
    });
  }

  return { track };
}

export type PointTracker = ReturnType<typeof createPointTracker>;
