import type { FunnelEventName } from "../types.ts";
import type { AnalyticsEventRecord, PointPerformance } from "./types.ts";
import { distinctCount, safePercentage } from "./utils.ts";

/**
 * Desempenho por PONTO DE ORIGEM (`initial_point_slug`), nunca pelo último
 * ponto adicionado no planejador. Isso responde precisamente "quem escaneou
 * o QR do Hospital do Gama fez o quê depois", mesmo que essa mesma pessoa
 * tenha, dentro do planejador, adicionado outros pontos além do de origem
 * (o que aconteceria se atribuíssemos ao `point_slug` de `planner_point_add`
 * em vez de ao `initial_point_slug` da sessão).
 *
 * Só linhas de domínio "funnel" carregam `initial_point_slug` — eventos de
 * domínio "point" nunca entram aqui (`mapPointEventToRow` grava
 * `initial_point_slug: null` deliberadamente, ver
 * `src/lib/analytics/persistence.ts`). Sessões sem `initial_point_slug`
 * (jornada não nasceu de `/ponto/$slug`) não aparecem nesta lista — não há
 * "ponto de origem" fabricado para elas.
 */
export function computePointPerformance(funnelRows: AnalyticsEventRecord[]): PointPerformance[] {
  const bySlug = new Map<string, AnalyticsEventRecord[]>();
  for (const row of funnelRows) {
    const slug = row.initial_point_slug;
    if (!slug) continue;
    const list = bySlug.get(slug);
    if (list) {
      list.push(row);
    } else {
      bySlug.set(slug, [row]);
    }
  }

  const countSessionsForStep = (rows: AnalyticsEventRecord[], event: FunnelEventName): number => {
    const set = new Set<string>();
    for (const row of rows) {
      if (row.event_name === event) set.add(row.session_id);
    }
    return set.size;
  };

  const results: PointPerformance[] = [];
  for (const [pointSlug, rows] of bySlug) {
    const qrLandingRows = rows.filter((r) => r.event_name === "qr_landing");
    const qrLandingSessions = distinctCount(qrLandingRows.map((r) => r.session_id));

    const plannerOpen = countSessionsForStep(rows, "planner_open");
    const plannerSubmit = countSessionsForStep(rows, "planner_submit");

    results.push({
      pointSlug,
      qrLandings: qrLandingRows.length,
      qrLandingSessions,
      sessions: distinctCount(rows.map((r) => r.session_id)),
      visitors: distinctCount(rows.map((r) => r.visitor_id)),
      pointViews: countSessionsForStep(rows, "point_view"),
      siteContinue: countSessionsForStep(rows, "site_continue"),
      plannerOpen,
      plannerStart: countSessionsForStep(rows, "planner_start"),
      plannerSummaryView: countSessionsForStep(rows, "planner_summary_view"),
      plannerSubmit,
      // Denominador é sempre qrLandingSessions (não `sessions`): a pergunta
      // é "de quem realmente escaneou o QR deste ponto, quantos avançaram",
      // não "de toda sessão atribuída a este ponto por qualquer motivo".
      qrToPlannerRate: safePercentage(plannerOpen, qrLandingSessions),
      qrToSubmitRate: safePercentage(plannerSubmit, qrLandingSessions),
    });
  }

  return results.sort((a, b) => b.qrLandings - a.qrLandings);
}
