import type { DateRange } from "../reporting/types.ts";

function isoDatePart(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * `mobtv-analytics-YYYY-MM-DD_YYYY-MM-DD.csv`. Usa `start`/`end` como estão
 * (instantes absolutos, ver `reporting/period.ts`) — `end` é EXCLUSIVO no
 * filtro dos dados, mas aqui é só um rótulo de arquivo; não convertemos
 * para "último dia incluído -1" para manter o nome consistente e previsível
 * com o range que foi de fato pedido.
 */
export function buildCsvFilename(range: DateRange): string {
  return `mobtv-analytics-${isoDatePart(range.start)}_${isoDatePart(range.end)}.csv`;
}
