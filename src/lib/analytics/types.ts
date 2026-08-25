/**
 * Esquema de eventos das páginas de perfil de ponto (QR Code). Ver
 * `src/lib/analytics/README.md` para o estado atual da persistência e o que
 * falta para um dashboard real.
 */

export const POINT_EVENT_NAMES = [
  "point_profile_view",
  "point_whatsapp_click",
  "point_email_click",
  "point_maps_click",
  "point_site_click",
  "point_scroll_depth",
] as const;

export type PointEventName = (typeof POINT_EVENT_NAMES)[number];

export type DeviceCategory = "mobile" | "tablet" | "desktop" | "unknown";

/**
 * Contexto do ponto/origem do QR — identifica QUAL ponto e QUAL ativo físico
 * (`assetId`, ex. "tela-01") gerou o acesso, lido de /ponto/$slug?src=&asset=.
 */
export type PointContext = {
  pointId: string; // slug
  pointName: string;
  categoryKey: string;
  assetId?: string;
  source?: string;
  utm?: Partial<Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_term" | "utm_content", string>>;
};

/**
 * Contexto de dispositivo/navegador — só o que dá para inferir de
 * `navigator`/`window` no cliente, sem fingerprinting. Nada aqui identifica
 * uma pessoa individualmente.
 */
export type DeviceContext = {
  deviceCategory: DeviceCategory;
  os?: string;
  browser?: string;
  language?: string;
  viewport?: string; // "390x844"
  screen?: string; // "390x844" (tela física, pode diferir do viewport)
  timezone?: string; // IANA, ex. "America/Sao_Paulo"
  referrer?: string;
};

/** Identificadores anônimos de sessão/visitante — nunca IP, nunca PII. */
export type VisitorContext = {
  visitorId: string; // aleatório, persistido em localStorage — "é a mesma pessoa que voltou?"
  sessionId: string; // aleatório, persistido em sessionStorage — escopo da visita atual
  isFirstVisit: boolean;
};

export type PointEventPayload = PointContext &
  DeviceContext &
  VisitorContext & {
    event: PointEventName;
    timestamp: string; // ISO 8601, gerado no cliente
    /** Só presente no evento point_scroll_depth — 25/50/75/100. */
    scrollDepthPercent?: number;
    /** Aproximado, calculado no cliente a partir do tempo desde o mount — só em cliques/scroll, não é preciso. */
    msSincePageLoad?: number;
  };
