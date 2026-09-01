import { getVisitorContext } from "./context";
import type { FunnelSession } from "./types";

/**
 * Sessão anônima do FUNIL de jornada (QR do ponto → site → planejador → CTA).
 *
 * - `anonymousSessionId` reaproveita o `sessionId` já existente
 *   (`mobtv_session_id`, sessionStorage) — assim os eventos de ponto e os
 *   eventos de funil da mesma visita compartilham o mesmo id.
 * - A atribuição de primeira interação (`source`, `initialPointSlug`,
 *   `qrId`, `firstTouchAt`, `landingPath`) é gravada UMA vez e nunca
 *   sobrescrita — o usuário pode navegar por `/`, `/rede`, `/midia`,
 *   `/planejador` sem perder de qual QR físico a jornada nasceu.
 * - Sem fingerprinting, sem IP, sem PII — só um UUID aleatório e a rota.
 */
const ATTRIBUTION_KEY = "mobtv_funnel_attribution";

type StoredAttribution = {
  source?: string;
  initialPointSlug?: string;
  qrId?: string;
  firstTouchAt: string;
  landingPath: string;
};

function readStored(): StoredAttribution | null {
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAttribution>;
    if (typeof parsed.firstTouchAt !== "string" || typeof parsed.landingPath !== "string") {
      return null;
    }
    return {
      source: typeof parsed.source === "string" ? parsed.source : undefined,
      initialPointSlug:
        typeof parsed.initialPointSlug === "string" ? parsed.initialPointSlug : undefined,
      qrId: typeof parsed.qrId === "string" ? parsed.qrId : undefined,
      firstTouchAt: parsed.firstTouchAt,
      landingPath: parsed.landingPath,
    };
  } catch {
    return null;
  }
}

function writeStored(value: StoredAttribution): void {
  try {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(value));
  } catch {
    // sessionStorage indisponível (modo privado restrito etc.) — segue sem persistir.
  }
}

function currentPathWithQuery(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Registra a atribuição de primeira interação. Idempotente: se a sessão já
 * tem atribuição, devolve a existente sem alterar nada (first-touch vence).
 */
export function captureFirstTouch(input: {
  source?: string;
  initialPointSlug?: string;
  qrId?: string;
  landingPath?: string;
}): FunnelSession {
  const { sessionId } = getVisitorContext();
  const landingPath = input.landingPath ?? currentPathWithQuery();

  if (typeof window === "undefined") {
    return {
      anonymousSessionId: sessionId,
      source: input.source,
      initialPointSlug: input.initialPointSlug,
      qrId: input.qrId,
      firstTouchAt: new Date().toISOString(),
      landingPath,
    };
  }

  let stored = readStored();
  if (!stored) {
    stored = {
      source: input.source,
      initialPointSlug: input.initialPointSlug,
      qrId: input.qrId,
      firstTouchAt: new Date().toISOString(),
      landingPath,
    };
    writeStored(stored);
  }
  return { anonymousSessionId: sessionId, ...stored };
}

/**
 * Sessão de funil atual. Se ainda não houver atribuição (jornada que começou
 * fora de um QR), grava uma mínima com a rota atual — assim todo evento
 * carrega ao menos `landingPath`/`firstTouchAt`; `source`/`initialPointSlug`
 * ficam vazios, nunca chutados.
 */
export function getFunnelSession(): FunnelSession {
  const { sessionId } = getVisitorContext();

  if (typeof window === "undefined") {
    return {
      anonymousSessionId: sessionId,
      firstTouchAt: new Date().toISOString(),
      landingPath: "",
    };
  }

  let stored = readStored();
  if (!stored) {
    stored = { firstTouchAt: new Date().toISOString(), landingPath: currentPathWithQuery() };
    writeStored(stored);
  }
  return { anonymousSessionId: sessionId, ...stored };
}
