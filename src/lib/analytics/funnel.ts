import { getDeviceContext, getVisitorContext } from "./context";
import { getFunnelSession } from "./session";
import { trackFunnelEvent } from "./server";
import type { FunnelEventName, MediaSelectToken } from "./types";

export { captureFirstTouch, getFunnelSession } from "./session";

type FunnelExtra = {
  pointSlug?: string;
  pointName?: string;
  categoryKey?: string;
  mediaType?: MediaSelectToken;
  planningIntent?: string;
};

/**
 * Dispara um evento de funil já preso à sessão anônima (mesmo
 * `anonymousSessionId` de toda a jornada) e à atribuição de primeira
 * interação (`source`, `initialPointSlug`, `qrId`, `firstTouchAt`,
 * `landingPath`). Nunca lança nem bloqueia a UI — falha aqui é só a perda
 * de um evento.
 */
export function trackFunnel(event: FunnelEventName, extra: FunnelExtra = {}) {
  if (typeof window === "undefined") return;

  const session = getFunnelSession();

  const payload = {
    ...getDeviceContext(),
    ...getVisitorContext(),
    event,
    timestamp: new Date().toISOString(),
    anonymousSessionId: session.anonymousSessionId,
    source: session.source,
    initialPointSlug: session.initialPointSlug,
    qrId: session.qrId,
    firstTouchAt: session.firstTouchAt,
    landingPath: session.landingPath,
    currentPath: window.location.pathname,
    ...extra,
  };

  trackFunnelEvent({ data: payload }).catch(() => {
    // Analytics nunca deve quebrar a experiência do usuário.
  });
}
