import assert from "node:assert/strict";
import test from "node:test";

import { renderEventsCsv } from "./csv.ts";
import { buildCsvFilename } from "./filename.ts";
import { formatNumber, formatPercentChange, formatRate, formatDateRange } from "./format.ts";
import { RAW_EXPORT_FIELDS } from "../reporting/raw-events.ts";
import type { RawExportRow } from "../reporting/raw-events.ts";

function exportRow(overrides: Partial<RawExportRow> = {}): RawExportRow {
  const base = Object.fromEntries(RAW_EXPORT_FIELDS.map((f) => [f, null])) as Record<
    string,
    unknown
  >;
  return {
    ...base,
    id: "r1",
    created_at: "2026-09-08T12:00:00.000Z",
    event_name: "point_view",
    event_domain: "funnel",
    visitor_id: "v1",
    session_id: "s1",
    metadata: {},
    ...overrides,
  } as RawExportRow;
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

test("CSV: header é exatamente RAW_EXPORT_FIELDS, na mesma ordem", () => {
  const csv = renderEventsCsv([]);
  const headerLine = csv.replace(/^\uFEFF/, "").split("\r\n")[0];
  assert.equal(headerLine, RAW_EXPORT_FIELDS.join(","));
});

test("CSV: começa com BOM UTF-8", () => {
  const csv = renderEventsCsv([]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
});

test("CSV: uma linha por evento, campos simples sem aspas desnecessárias", () => {
  const csv = renderEventsCsv([exportRow({ id: "r1" }), exportRow({ id: "r2" })]);
  const lines = csv.replace(/^\uFEFF/, "").split("\r\n");
  assert.equal(lines.length, 3, "header + 2 linhas");
  assert.ok(lines[1].startsWith("r1,"));
  assert.ok(lines[2].startsWith("r2,"));
});

test("CSV: escaping — vírgula, aspas e quebra de linha no valor viram campo entre aspas com aspas internas dobradas", () => {
  const csv = renderEventsCsv([exportRow({ landing_path: 'a,b "quoted"\nnewline' })]);
  const lines = csv.replace(/^\uFEFF/, "").split("\r\n");
  // landing_path é o 11º campo (índice 10) em RAW_EXPORT_FIELDS
  const fieldIndex = RAW_EXPORT_FIELDS.indexOf("landing_path");
  assert.equal(fieldIndex >= 0, true);
  assert.ok(lines[1].includes('"a,b ""quoted""'), "vírgula/aspas internas escapadas corretamente");
});

test("CSV: metadata (objeto) é serializada como JSON de forma segura, sem quebrar a linha", () => {
  const csv = renderEventsCsv([
    exportRow({ metadata: { pointName: "Estação, Central", nested: { a: 1 } } }),
  ]);
  const lines = csv.replace(/^\uFEFF/, "").split("\r\n");
  assert.equal(lines.length, 2, "metadata com vírgula não vira linha extra");
  assert.ok(lines[1].includes('"{""pointName"":""Esta'), "JSON serializado e escapado");
});

test("CSV: valores null viram campo vazio, não a string 'null'", () => {
  const csv = renderEventsCsv([exportRow({ os: null })]);
  const lines = csv.replace(/^\uFEFF/, "").split("\r\n");
  const osIndex = RAW_EXPORT_FIELDS.indexOf("os");
  const cells = lines[1].split(",");
  assert.equal(cells[osIndex], "");
});

test("CSV: suporta acentuação UTF-8 sem corromper (round-trip)", () => {
  const csv = renderEventsCsv([exportRow({ point_slug: "estação-são-joão" })]);
  assert.ok(csv.includes("estação-são-joão"));
});

test("CSV vazio (sem eventos) ainda tem header", () => {
  const csv = renderEventsCsv([]);
  const lines = csv.replace(/^\uFEFF/, "").split("\r\n");
  assert.equal(lines.length, 1);
});

// ---------------------------------------------------------------------------
// filename
// ---------------------------------------------------------------------------

test("filename: mobtv-analytics-YYYY-MM-DD_YYYY-MM-DD.csv", () => {
  const name = buildCsvFilename({
    start: new Date("2026-09-08T00:00:00.000Z"),
    end: new Date("2026-09-15T00:00:00.000Z"),
  });
  assert.equal(name, "mobtv-analytics-2026-09-08_2026-09-15.csv");
});

// ---------------------------------------------------------------------------
// format
// ---------------------------------------------------------------------------

test("formatNumber: separador de milhar pt-BR", () => {
  assert.equal(formatNumber(1240), "1.240");
});

test("formatPercentChange: sinal explícito, null vira travessão, nunca NaN/Infinity", () => {
  assert.equal(formatPercentChange(18.2), "+18,2%");
  assert.equal(formatPercentChange(-5), "-5,0%");
  assert.equal(formatPercentChange(0), "0,0%");
  assert.equal(formatPercentChange(null), "—");
  assert.equal(formatPercentChange(NaN), "—");
  assert.equal(formatPercentChange(Infinity), "—");
});

test("formatRate: percentual sem sinal, null vira travessão", () => {
  assert.equal(formatRate(42), "42,0%");
  assert.equal(formatRate(null), "—");
  assert.equal(formatRate(Infinity), "—");
});

test("formatDateRange: dd/mm/aaaa a dd/mm/aaaa em UTC", () => {
  const label = formatDateRange({
    start: new Date("2026-09-08T00:00:00.000Z"),
    end: new Date("2026-09-15T00:00:00.000Z"),
  });
  assert.equal(label, "08/09/2026 a 15/09/2026");
});
