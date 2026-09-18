import type { DateRange } from "../reporting/types.ts";

/**
 * Formatadores/escaping compartilhados por `html.ts` e `text.ts`. Nada aqui
 * calcula métrica nenhuma — só formata números que o Bloco B já produziu.
 */

const numberFormatter = new Intl.NumberFormat("pt-BR");
const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Percentual "puro" (taxa/progressão), sem sinal — "42,0%". `null` vira "—", nunca "NaN%". */
export function formatRate(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${percentFormatter.format(value)}%`;
}

/** Percentual de VARIAÇÃO (comparação com período anterior), com sinal — "+18,2%"/"-5,0%"/"0,0%". `null` vira "—". */
export function formatPercentChange(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const formatted = percentFormatter.format(Math.abs(value));
  if (value > 0) return `+${formatted}%`;
  if (value < 0) return `-${formatted}%`;
  return `${formatted}%`;
}

/** dd/mm/aaaa, sempre em UTC — os limites de `DateRange` são instantes absolutos (ver reporting/period.ts), não datas locais. */
export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatDateRange(range: DateRange): string {
  return `${formatDate(range.start)} a ${formatDate(range.end)}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
