import type {
  AnalyticsEventRecord,
  DateRange,
  MetricComparison,
  Overview,
  PeriodComparison,
} from "./types.ts";

/**
 * [start, end) — start inclusive, end exclusivo. Comparação por instante
 * absoluto (`created_at` é `timestamptz`); timezone não entra aqui, só na
 * bucketização de `daily` (ver `daily.ts`). Essa escolha de limites evita
 * dupla contagem entre relatórios consecutivos: o `end` de uma semana é
 * exatamente o `start` da semana seguinte.
 */
export function filterByRange<T extends AnalyticsEventRecord>(rows: T[], range: DateRange): T[] {
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  return rows.filter((row) => {
    const ts = new Date(row.created_at).getTime();
    return ts >= startMs && ts < endMs;
  });
}

/**
 * Período anterior de duração IDÊNTICA, imediatamente antes de `start`.
 * Ex.: relatório 08/09→15/09 compara com 01/09→08/09 (7 dias antes dos
 * mesmos 7 dias) — funciona igual para qualquer duração (diário, semanal,
 * mensal, período customizado), sem hardcode de "7 dias".
 */
export function previousRange(range: DateRange): DateRange {
  const durationMs = range.end.getTime() - range.start.getTime();
  return {
    start: new Date(range.start.getTime() - durationMs),
    end: new Date(range.start.getTime()),
  };
}

function compareMetric(current: number, previous: number): MetricComparison {
  const absoluteChange = current - previous;
  // previous === 0 -> variação percentual não é matematicamente definida
  // (dividiria por zero); null em vez de Infinity/NaN, mesmo se current > 0.
  const percentChange = previous === 0 ? null : (absoluteChange / previous) * 100;
  return { current, previous, absoluteChange, percentChange };
}

export function compareOverview(
  current: Overview,
  previous: Overview,
): Omit<PeriodComparison, "previousRange"> {
  return {
    events: compareMetric(current.events, previous.events),
    sessions: compareMetric(current.sessions, previous.sessions),
    visitors: compareMetric(current.visitors, previous.visitors),
    qrLandings: compareMetric(current.qrLandings, previous.qrLandings),
    pointViews: compareMetric(current.pointViews, previous.pointViews),
  };
}
