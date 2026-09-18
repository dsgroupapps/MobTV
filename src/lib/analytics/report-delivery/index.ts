/**
 * Apresentação/envio do AnalyticsReport (Bloco B) por e-mail — HTML + texto
 * + CSV bruto anexado, via Resend. Nenhuma métrica é recalculada aqui.
 *
 * Uso típico:
 *   const pkg = await generateAnalyticsReportPackage({ repository, start, end }); // dry-run
 *   const result = await sendAnalyticsReport({ repository, start, end });          // envia de verdade
 */
export * from "./types.ts";
export * from "./format.ts";
export * from "./csv.ts";
export * from "./filename.ts";
export * from "./html.ts";
export * from "./text.ts";
export * from "./resend-client.ts";
export * from "./package.ts";
export * from "./send.ts";
