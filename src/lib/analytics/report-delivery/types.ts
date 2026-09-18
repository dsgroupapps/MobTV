import type { AnalyticsReport } from "../reporting/types.ts";

/**
 * Resultado de `generateAnalyticsReportPackage` — tudo que
 * `sendAnalyticsReport` precisa para enviar, e tudo que um dry-run precisa
 * para inspecionar sem enviar nada. `report` é sempre o `AnalyticsReport`
 * produzido pelo Bloco B (`buildAnalyticsReport`) sem nenhum recálculo —
 * `html`/`text`/`csv` são só apresentações desse mesmo objeto.
 */
export type AnalyticsReportPackage = {
  report: AnalyticsReport;
  html: string;
  text: string;
  csv: string;
  /** Tamanho do CSV em bytes (UTF-8), antes de qualquer codificação para anexo. */
  csvBytes: number;
  filename: string;
};

export type SendAnalyticsReportResult = {
  ok: true;
  sentTo: string;
  filename: string;
  csvBytes: number;
  /** id retornado pelo Resend, quando presente na resposta. */
  resendId?: string;
};
