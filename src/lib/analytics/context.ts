import type { DeviceCategory, DeviceContext, VisitorContext } from "./types";

const VISITOR_ID_KEY = "mobtv_visitor_id";
const SESSION_ID_KEY = "mobtv_session_id";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Fallback só para navegadores muito antigos sem crypto.randomUUID.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Identificadores anônimos — só um UUID aleatório guardado localmente,
 * nunca derivado de IP, e-mail ou qualquer dado que identifique a pessoa.
 * `visitorId` sobrevive entre sessões (localStorage) e permite distinguir
 * primeiro acesso de retorno; `sessionId` é por aba/sessão (sessionStorage).
 */
export function getVisitorContext(): VisitorContext {
  if (typeof window === "undefined") {
    return { visitorId: "ssr", sessionId: "ssr", isFirstVisit: true };
  }

  let visitorId: string;
  let isFirstVisit = false;
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing) {
      visitorId = existing;
    } else {
      visitorId = randomId();
      window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
      isFirstVisit = true;
    }
  } catch {
    // localStorage indisponível (modo privado restrito etc.) — segue sem persistir.
    visitorId = randomId();
    isFirstVisit = true;
  }

  let sessionId: string;
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) {
      sessionId = existing;
    } else {
      sessionId = randomId();
      window.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
  } catch {
    sessionId = randomId();
  }

  return { visitorId, sessionId, isFirstVisit };
}

function detectDeviceCategory(ua: string): DeviceCategory {
  if (!ua) return "unknown";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod/i.test(ua)) return "mobile";
  return "desktop";
}

function detectOS(ua: string): string {
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Outro";
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) return "Chrome";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) return "Safari";
  return "Outro";
}

/**
 * Contexto de dispositivo — só sinais já expostos pelo próprio navegador via
 * `navigator`/`window`/`Intl`. Nada de canvas fingerprinting, WebGL hashing
 * ou qualquer técnica para identificar o aparelho de forma única.
 */
export function getDeviceContext(): DeviceContext {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { deviceCategory: "unknown" };
  }
  const ua = navigator.userAgent ?? "";
  return {
    deviceCategory: detectDeviceCategory(ua),
    os: detectOS(ua),
    browser: detectBrowser(ua),
    language: navigator.language,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screen: window.screen ? `${window.screen.width}x${window.screen.height}` : undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer: document.referrer || undefined,
  };
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

/** Extrai utm_* de um objeto de search params já parseado pela rota. */
export function extractUtm(
  search: Record<string, unknown>,
): Partial<Record<(typeof UTM_KEYS)[number], string>> {
  const utm: Partial<Record<(typeof UTM_KEYS)[number], string>> = {};
  for (const key of UTM_KEYS) {
    const value = search[key];
    if (typeof value === "string" && value.length > 0) utm[key] = value;
  }
  return utm;
}
