import { FUNNEL_EVENT_NAMES, type FunnelEventName } from "../types.ts";
import type { AnalyticsEventRecord, FunnelResult, FunnelStepResult } from "./types.ts";
import { distinctCount, safePercentage } from "./utils.ts";

/** Rótulos em pt-BR das 9 etapas — na MESMA ordem de `FUNNEL_EVENT_NAMES` (fonte de verdade dos eventos, `src/lib/analytics/types.ts`). Nenhum evento novo inventado aqui. */
const STEP_LABELS: Record<FunnelEventName, string> = {
  qr_landing: "QR landing",
  point_view: "Visualização do ponto",
  site_continue: "Continuação no site",
  planner_open: "Planejador aberto",
  planner_start: "Planejador iniciado",
  planner_point_add: "Ponto adicionado",
  planner_media_select: "Mídia selecionada",
  planner_summary_view: "Resumo visualizado",
  planner_submit: "Proposta solicitada",
};

function distinctSessionsForEvent(rows: AnalyticsEventRecord[], event: FunnelEventName): number {
  const set = new Set<string>();
  for (const row of rows) {
    if (row.event_name === event) set.add(row.session_id);
  }
  return set.size;
}

/**
 * Sessões cuja jornada nasceu de um QR — mesma regra usada para disparar
 * `qr_landing` no código real (`search.src === "qr"`, ver
 * `src/routes/ponto.$slug.tsx`): qualquer linha de domínio "funnel" da
 * sessão com `source === "qr"`.
 *
 * Como a atribuição de first-touch é gravada UMA vez por sessão em
 * `sessionStorage` e reutilizada em todo evento de funil dela (ver
 * `src/lib/analytics/session.ts` — "first-touch vence"), todas as linhas de
 * funil da mesma sessão concordam sobre `source`. Checar qualquer uma
 * equivale a checar a primeira; por isso este helper varre todas sem se
 * preocupar com ordem.
 */
export function qrOriginSessionIds(funnelRows: AnalyticsEventRecord[]): Set<string> {
  const set = new Set<string>();
  for (const row of funnelRows) {
    if (row.source === "qr") set.add(row.session_id);
  }
  return set;
}

/**
 * Funil por SESSION_ID DISTINCT por etapa — nunca por contagem de eventos
 * (uma sessão que recarrega a página do ponto não "avança" várias vezes).
 * `pctOfFirstStep` é relativo à primeira etapa (`qr_landing`);
 * `pctOfPreviousStep`, à etapa anterior nesta lista.
 *
 * As etapas NÃO são forçosamente sequenciais por sessão — ex. uma sessão
 * pode ter `planner_open` sem nunca ter tido `qr_landing` (tráfego orgânico
 * direto para `/planejador`). Cada etapa é contada de forma independente;
 * o funil descreve alcance por etapa, não um funil estritamente ordenado.
 */
export function computeFunnel(funnelRows: AnalyticsEventRecord[]): FunnelResult {
  const totalSessions = distinctCount(funnelRows.map((r) => r.session_id));

  const steps: FunnelStepResult[] = [];
  let firstStepSessions: number | null = null;
  let previousStepSessions: number | null = null;

  for (const event of FUNNEL_EVENT_NAMES) {
    const sessions = distinctSessionsForEvent(funnelRows, event);
    if (firstStepSessions === null) firstStepSessions = sessions;

    steps.push({
      event,
      label: STEP_LABELS[event],
      sessions,
      pctOfFirstStep: safePercentage(sessions, firstStepSessions),
      pctOfPreviousStep:
        previousStepSessions === null ? null : safePercentage(sessions, previousStepSessions),
    });

    previousStepSessions = sessions;
  }

  return { totalSessions, steps };
}

/**
 * Funil QR: mesma mecânica de `computeFunnel`, restrito às sessões cujo
 * first-touch veio de QR (`qrOriginSessionIds`). Existe separado do funil
 * geral para não misturar a eficácia real dos QR Codes físicos com tráfego
 * comum do site (alguém que chega direto em `/planejador`, por exemplo).
 */
export function computeQrFunnel(funnelRows: AnalyticsEventRecord[]): FunnelResult {
  const qrSessions = qrOriginSessionIds(funnelRows);
  const scoped = funnelRows.filter((r) => qrSessions.has(r.session_id));
  return computeFunnel(scoped);
}
