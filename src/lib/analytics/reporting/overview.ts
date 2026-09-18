import type { AnalyticsEventRecord, Overview } from "./types.ts";
import { distinctCount } from "./utils.ts";

/**
 * Definições exatas (fonte de verdade desta função):
 *
 * - EVENTOS TOTAIS: `COUNT(*)` das linhas recebidas (já filtradas por
 *   período e por exclusão de teste por quem chama — ver `report.ts`).
 * - SESSÕES: `COUNT DISTINCT session_id`.
 * - VISITANTES: `COUNT DISTINCT visitor_id` — representa um NAVEGADOR
 *   identificado (`visitorId` em localStorage, ver
 *   `src/lib/analytics/context.ts`), não uma pessoa física garantidamente
 *   única (o mesmo visitante pode voltar de outro navegador/dispositivo e
 *   virar um `visitor_id` diferente).
 * - QR LANDINGS: `COUNT(*)` de `event_name = "qr_landing"` — contagem de
 *   EVENTOS, não de sessões/pessoas únicas (uma sessão que recarrega a
 *   página do ponto pode gerar mais de um `qr_landing`).
 * - POINT VIEWS: `COUNT(*)` de `event_name = "point_view"` (domínio
 *   "funnel"). Essa é a métrica CANÔNICA de "abertura de /ponto/$slug".
 *
 *   Decisão documentada: `point_profile_view` (domínio "point", disparado
 *   por `PointProfile.tsx`) dispara na MESMA abertura de página que
 *   `point_view` (disparado por `ponto.$slug.tsx`) — ambos incondicionais,
 *   uma vez por montagem da rota. Somar os dois contaria a mesma visita
 *   duas vezes. `point_view` foi escolhido como canônico porque (1) vive no
 *   mesmo domínio "funnel" que o resto do funil, permitindo construir o
 *   funil inteiro a partir de um único domínio sem join entre tabelas
 *   virtuais; e (2) carrega o contexto de atribuição (`initial_point_slug`,
 *   `source`) que `point_profile_view` não carrega. `point_profile_view`
 *   continua sendo persistido e contando para `events`, só não é usado como
 *   a métrica de "visualizações de ponto".
 */
export function computeOverview(rows: AnalyticsEventRecord[]): Overview {
  return {
    events: rows.length,
    sessions: distinctCount(rows.map((r) => r.session_id)),
    visitors: distinctCount(rows.map((r) => r.visitor_id)),
    qrLandings: rows.filter((r) => r.event_name === "qr_landing").length,
    pointViews: rows.filter((r) => r.event_name === "point_view").length,
  };
}
