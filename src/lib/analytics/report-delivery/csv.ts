import { RAW_EXPORT_FIELDS, type RawExportRow } from "../reporting/raw-events.ts";

/**
 * RFC4180-ish: campo entre aspas se contiver vírgula, aspas ou quebra de
 * linha; aspas internas dobradas. `metadata` (jsonb) vira uma string JSON
 * antes de passar por essa mesma regra — nunca quebra a linha do CSV.
 */
function csvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  const needsQuoting = /[",\n\r]/.test(text);
  const escaped = text.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

/**
 * CSV dos eventos brutos de um período — recebe as linhas JÁ filtradas e
 * projetadas por `selectRawAnalyticsEvents` (Bloco B); não decide sozinho
 * quais campos existem, reaproveita `RAW_EXPORT_FIELDS` como header E como
 * ordem das colunas, então os dois nunca podem divergir.
 *
 * `\r\n` (CRLF) como separador de linha e um BOM UTF-8 no início: o Excel
 * (principalmente no Windows) detecta UTF-8 automaticamente com o BOM —
 * sem ele, acentos podem aparecer corrompidos. O BOM é ignorado por
 * parsers CSV padrão (Node, Python, etc.), então não quebra nada fora do
 * Excel.
 */
export function renderEventsCsv(rows: RawExportRow[]): string {
  const header = RAW_EXPORT_FIELDS.join(",");
  const lines = rows.map((row) => RAW_EXPORT_FIELDS.map((field) => csvField(row[field])).join(","));
  const body = [header, ...lines].join("\r\n");
  return `\uFEFF${body}`;
}
