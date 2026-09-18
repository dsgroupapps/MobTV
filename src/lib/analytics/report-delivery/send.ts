import "@tanstack/react-start/server-only";

import { z } from "zod";

import {
  generateAnalyticsReportPackage,
  type GenerateAnalyticsReportPackageOptions,
} from "./package.ts";
import { AnalyticsEmailError, sendEmailWithCsvAttachment } from "./resend-client.ts";
import { formatDateRange } from "./format.ts";
import type { SendAnalyticsReportResult } from "./types.ts";

/**
 * Mesmo padrão de leitura de env de `src/lib/leads/point-lead.ts`
 * (`process.env[key]?.trim()`) — nunca loga o valor.
 */
function envValue(key: string): string | undefined {
  return typeof process !== "undefined" ? process.env[key]?.trim() : undefined;
}

const emailSchema = z.string().trim().email();

export type SendAnalyticsReportOptions = Omit<GenerateAnalyticsReportPackageOptions, never> & {
  /**
   * Destinatário explícito, só para uso manual/testes server-side — NUNCA
   * aceito vindo de parâmetro público/browser (esta função não é exposta
   * por nenhuma rota pública). Sem isso, usa `MOBTV_ANALYTICS_TO_EMAIL`.
   */
  recipient?: string;
  fetchImpl?: typeof fetch;
};

/**
 * ENVIO: valida a configuração do Resend (falha ANTES de consultar a Edge
 * Function, se já sabemos que não vai dar para enviar), gera o pacote via
 * `generateAnalyticsReportPackage` (mesma função do dry-run — nenhuma
 * duplicação de lógica de geração) e envia com `sendEmailWithCsvAttachment`.
 *
 * Env vars (todas server-only, nunca `VITE_*`):
 * - `RESEND_API_KEY` — obrigatória.
 * - `MOBTV_ANALYTICS_FROM_EMAIL` — obrigatória, com fallback documentado
 *   para `MOBTV_LEADS_FROM_EMAIL` (mesmo remetente já verificado no Resend
 *   para os e-mails de lead — evita exigir um segundo remetente verificado
 *   só para este relatório). Sem nenhuma das duas, falha.
 * - `MOBTV_ANALYTICS_TO_EMAIL` — destinatário padrão, PRÓPRIO de analytics
 *   (nunca cai para o e-mail comercial de leads). `options.recipient`
 *   sobrescreve, só para chamada manual/server-side.
 */
export async function sendAnalyticsReport(
  options: SendAnalyticsReportOptions,
): Promise<SendAnalyticsReportResult> {
  const apiKey = envValue("RESEND_API_KEY");
  const fromEmail = envValue("MOBTV_ANALYTICS_FROM_EMAIL") ?? envValue("MOBTV_LEADS_FROM_EMAIL");
  const rawRecipient = options.recipient ?? envValue("MOBTV_ANALYTICS_TO_EMAIL");

  const missing = {
    RESEND_API_KEY: !apiKey,
    "MOBTV_ANALYTICS_FROM_EMAIL (ou MOBTV_LEADS_FROM_EMAIL)": !fromEmail,
    "MOBTV_ANALYTICS_TO_EMAIL (ou recipient explícito)": !rawRecipient,
  };
  const missingKeys = Object.entries(missing)
    .filter(([, isMissing]) => isMissing)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    console.error(
      JSON.stringify({
        kind: "analytics_report_email_not_configured",
        missing: missingKeys,
      }),
    );
    throw new AnalyticsEmailError(
      `Envio do relatório de analytics não configurado — faltando: ${missingKeys.join(", ")}.`,
    );
  }

  const recipientResult = emailSchema.safeParse(rawRecipient);
  if (!recipientResult.success) {
    throw new AnalyticsEmailError("Destinatário do relatório de analytics não é um e-mail válido.");
  }
  const recipient = recipientResult.data;

  const pkg = await generateAnalyticsReportPackage(options);

  const result = await sendEmailWithCsvAttachment({
    apiKey: apiKey!,
    from: fromEmail!,
    to: recipient,
    subject: `MOBTV Analytics — Relatório de ${formatDateRange(pkg.report.range)}`,
    html: pkg.html,
    text: pkg.text,
    attachment: { filename: pkg.filename, content: pkg.csv, contentType: "text/csv" },
    fetchImpl: options.fetchImpl,
  });

  return {
    ok: true,
    sentTo: recipient,
    filename: pkg.filename,
    csvBytes: pkg.csvBytes,
    resendId: result.id,
  };
}
