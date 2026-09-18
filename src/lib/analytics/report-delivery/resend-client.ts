import "@tanstack/react-start/server-only";

/**
 * Envio via Resend, mesmo padrão de `src/lib/leads/point-lead.ts` (fetch
 * cru para `https://api.resend.com/emails`, sem SDK) — estendido só com
 * `attachments`, no formato documentado pela API do Resend: array de
 * `{ filename, content: <base64>, content_type }`. Não reaproveita nem
 * altera o comportamento do sistema de leads.
 */

/**
 * 8 MiB de CSV bruto (~10,7 MiB depois de Base64) — bem abaixo do limite
 * documentado do Resend (40 MB por e-mail, JÁ contando a codificação
 * Base64 dos anexos). Relatórios semanais de um sistema com 51 pontos não
 * deveriam chegar nem perto disso; se chegarem, é sinal de que algo mudou
 * (ex. volume muito maior que o esperado) e merece decisão explícita, não
 * truncar dado bruto silenciosamente.
 */
export const MAX_CSV_ATTACHMENT_BYTES = 8 * 1024 * 1024;

export class AnalyticsEmailError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AnalyticsEmailError";
  }
}

function truncateForError(text: string, max = 300): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export type SendEmailWithCsvAttachmentParams = {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachment: { filename: string; content: string; contentType: string };
  /** Injeção para testes — nunca chamado de verdade nos testes automatizados. */
  fetchImpl?: typeof fetch;
};

export async function sendEmailWithCsvAttachment(
  params: SendEmailWithCsvAttachmentParams,
): Promise<{ ok: true; id?: string }> {
  const contentBytes = Buffer.byteLength(params.attachment.content, "utf8");
  if (contentBytes > MAX_CSV_ATTACHMENT_BYTES) {
    throw new AnalyticsEmailError(
      `CSV de ${contentBytes} bytes excede o limite de ${MAX_CSV_ATTACHMENT_BYTES} bytes configurado para o anexo do relatório de analytics — envio abortado (nada foi enviado).`,
    );
  }

  const fetchImpl = params.fetchImpl ?? fetch;
  const base64Content = Buffer.from(params.attachment.content, "utf8").toString("base64");

  let response: Response;
  try {
    response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: params.from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        attachments: [
          {
            filename: params.attachment.filename,
            content: base64Content,
            content_type: params.attachment.contentType,
          },
        ],
      }),
    });
  } catch (error) {
    throw new AnalyticsEmailError(
      `Falha de rede ao enviar o relatório de analytics via Resend: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new AnalyticsEmailError(
      `Resend respondeu HTTP ${response.status}${bodyText ? `: ${truncateForError(bodyText)}` : ""}`,
    );
  }

  const json = (await response.json().catch(() => ({}))) as { id?: string };
  return { ok: true, id: json.id };
}
