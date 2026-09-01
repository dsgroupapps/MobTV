/**
 * Esquema de eventos das páginas de perfil de ponto (QR Code). Ver
 * `src/lib/analytics/README.md` para o estado atual da persistência e o que
 * falta para um dashboard real.
 */

import type { MediaTypeKey } from "@/data/network-points";

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
  utm?: Partial<
    Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_term" | "utm_content", string>
  >;
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

// ===================================================================
// Funil de jornada (QR do ponto → site → planejador → CTA final)
// ===================================================================

/**
 * Eventos do funil que atravessa várias páginas. Todos compartilham o
 * `anonymousSessionId` e carregam `initialPointSlug` para sabermos de qual
 * QR físico a jornada nasceu.
 */
export const FUNNEL_EVENT_NAMES = [
  "qr_landing",
  "point_view",
  "site_continue",
  "planner_open",
  "planner_start",
  "planner_point_add",
  "planner_media_select",
  "planner_summary_view",
  "planner_submit",
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENT_NAMES)[number];

/** Token público de mídia usado no evento `planner_media_select`. */
export type MediaSelectToken = "screen" | "panel_led" | "wifi_ads";

export const MEDIA_SELECT_TOKEN: Record<MediaTypeKey, MediaSelectToken> = {
  screen: "screen",
  led: "panel_led",
  wifi: "wifi_ads",
};

/**
 * Atribuição de primeira interação da sessão anônima. Capturada uma única
 * vez (first-touch vence) e preservada em `sessionStorage` enquanto o
 * usuário navega por `/`, `/rede`, `/midia`, `/planejador` etc.
 */
export type FunnelSession = {
  /** = `sessionId` do VisitorContext (mesmo id em todos os eventos da jornada). */
  anonymousSessionId: string;
  /** "qr" quando a jornada nasceu de `/ponto/$slug?src=qr`. */
  source?: string;
  /** slug do ponto físico do QR escaneado. */
  initialPointSlug?: string;
  /** opcional — só se um `?qr_id=` estiver na URL. Nada depende dele. */
  qrId?: string;
  firstTouchAt: string; // ISO 8601
  landingPath: string; // ex. "/ponto/estacao-central-plano-piloto?src=qr"
};

export type FunnelEventPayload = DeviceContext &
  VisitorContext &
  Omit<FunnelSession, "anonymousSessionId"> & {
    event: FunnelEventName;
    timestamp: string; // ISO 8601, gerado no cliente
    anonymousSessionId: string;
    /** rota em que o evento foi disparado (não é PII). */
    currentPath?: string;
    /** ponto envolvido no evento (point_view / planner_point_add / planner_media_select). */
    pointSlug?: string;
    pointName?: string;
    categoryKey?: string;
    /** só em planner_media_select. */
    mediaType?: MediaSelectToken;
    /** intenção dooh/wifi/both escolhida na etapa 1 do planejador. */
    planningIntent?: string;
  };
