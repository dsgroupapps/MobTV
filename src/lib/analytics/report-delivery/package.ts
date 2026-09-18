import "@tanstack/react-start/server-only";

import { buildAnalyticsReport } from "../reporting/report.ts";
import { previousRange } from "../reporting/period.ts";
import { selectRawAnalyticsEvents } from "../reporting/raw-events.ts";
import type { AnalyticsEventsRepository } from "../reporting/repository.ts";
import { renderEventsCsv } from "./csv.ts";
import { buildCsvFilename } from "./filename.ts";
import { renderReportHtml } from "./html.ts";
import { renderReportText } from "./text.ts";
import type { AnalyticsReportPackage } from "./types.ts";

export type GenerateAnalyticsReportPackageOptions = {
  repository: AnalyticsEventsRepository;
  start: Date;
  end: Date;
  /** default "America/Sao_Paulo" (mesmo default do Bloco B, ver reporting/report.ts). */
  timezone?: string;
  /** default `false` — eventos de teste excluídos, como em todo o Bloco B. */
  includeTestEvents?: boolean;
};

/**
 * GERAÇÃO (sem envio): busca as linhas do período atual e do período
 * anterior (para a comparação), monta o `AnalyticsReport` via
 * `buildAnalyticsReport` — a mesma função pura do Bloco B, sem nenhum
 * recálculo aqui — e a partir DESSE MESMO objeto (e das mesmas linhas já em
 * memória) gera HTML, texto e CSV. Só duas requisições à Edge Function no
 * total (período atual + período anterior); o CSV reaproveita as linhas do
 * período atual já buscadas, sem uma terceira consulta.
 *
 * Não fala com Resend — é o que os testes e o modo dry-run usam para
 * inspecionar `report`/`html`/`text`/`csv`/`filename` sem enviar nada.
 */
export async function generateAnalyticsReportPackage(
  options: GenerateAnalyticsReportPackageOptions,
): Promise<AnalyticsReportPackage> {
  const range = { start: options.start, end: options.end };
  const fetchOptions = { includeTestEvents: options.includeTestEvents ?? false };

  const [rows, previousRows] = await Promise.all([
    options.repository.fetchEvents(range, fetchOptions),
    options.repository.fetchEvents(previousRange(range), fetchOptions),
  ]);

  const report = buildAnalyticsReport(rows, {
    start: options.start,
    end: options.end,
    timezone: options.timezone,
    includeTestEvents: options.includeTestEvents,
    previousRows,
  });

  const csvRows = selectRawAnalyticsEvents(rows, {
    start: options.start,
    end: options.end,
    includeTestEvents: options.includeTestEvents,
  });
  const csv = renderEventsCsv(csvRows);

  return {
    report,
    html: renderReportHtml(report),
    text: renderReportText(report),
    csv,
    csvBytes: Buffer.byteLength(csv, "utf8"),
    filename: buildCsvFilename(range),
  };
}
