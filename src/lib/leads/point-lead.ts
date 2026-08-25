import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const COMMERCIAL_EMAIL = "comercial@mobtv.tv.br";

const pointLeadSchema = z.object({
  nome: z.string().trim().min(2),
  empresa: z.string().trim().optional(),
  contato: z.string().trim().min(5),
  campanha: z.string().trim().optional(),
  pointName: z.string().trim().min(2),
  pointSlug: z.string().trim().min(1),
  pageUrl: z.string().trim().min(1),
  submittedAt: z.string().trim().min(1),
  utm_source: z.string().trim().optional(),
  utm_medium: z.string().trim().optional(),
  utm_campaign: z.string().trim().optional(),
  utm_content: z.string().trim().optional(),
});

export type PointLeadPayload = z.infer<typeof pointLeadSchema>;

function envValue(key: string) {
  return typeof process !== "undefined" ? process.env[key]?.trim() : undefined;
}

function field(label: string, value: string | undefined) {
  return value && value.length > 0 ? `${label}: ${value}` : `${label}: -`;
}

function buildEmailText(data: PointLeadPayload) {
  return [
    "Novo interesse recebido pela pagina de perfil de ponto da MOBTV.",
    "",
    "Lead",
    field("Nome", data.nome),
    field("Empresa", data.empresa),
    field("Contato para retorno", data.contato),
    field("Sobre a campanha", data.campanha),
    "",
    "Ponto associado",
    field("Nome do ponto", data.pointName),
    field("Slug", data.pointSlug),
    field("URL", data.pageUrl),
    field("Data/hora", data.submittedAt),
    "",
    "UTM",
    field("utm_source", data.utm_source),
    field("utm_medium", data.utm_medium),
    field("utm_campaign", data.utm_campaign),
    field("utm_content", data.utm_content),
  ].join("\n");
}

function buildEmailHtml(data: PointLeadPayload) {
  const rows = [
    ["Nome", data.nome],
    ["Empresa", data.empresa],
    ["Contato para retorno", data.contato],
    ["Sobre a campanha", data.campanha],
    ["Nome do ponto", data.pointName],
    ["Slug", data.pointSlug],
    ["URL", data.pageUrl],
    ["Data/hora", data.submittedAt],
    ["utm_source", data.utm_source],
    ["utm_medium", data.utm_medium],
    ["utm_campaign", data.utm_campaign],
    ["utm_content", data.utm_content],
  ];

  return `
    <h2>Novo interesse em ponto MOBTV</h2>
    <p>Lead recebido pela pagina publica de perfil de ponto.</p>
    <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
      ${rows
        .map(
          ([label, value]) => `
            <tr>
              <th align="left" style="border:1px solid #ddd;background:#f7f7f7">${label}</th>
              <td style="border:1px solid #ddd">${value || "-"}</td>
            </tr>
          `,
        )
        .join("")}
    </table>
  `;
}

export const submitPointLead = createServerFn({ method: "POST" })
  .validator((data: unknown): PointLeadPayload => pointLeadSchema.parse(data))
  .handler(async ({ data }) => {
    const resendApiKey = envValue("RESEND_API_KEY");
    const fromEmail = envValue("MOBTV_LEADS_FROM_EMAIL");
    const toEmail = envValue("MOBTV_LEADS_TO_EMAIL") || COMMERCIAL_EMAIL;

    if (!resendApiKey || !fromEmail) {
      console.error(
        JSON.stringify({
          kind: "point_lead_email_not_configured",
          pointSlug: data.pointSlug,
          pointName: data.pointName,
          missing: {
            RESEND_API_KEY: !resendApiKey,
            MOBTV_LEADS_FROM_EMAIL: !fromEmail,
          },
        }),
      );
      throw new Error("point lead email is not configured");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `Interesse em anunciar - ${data.pointName}`,
        text: buildEmailText(data),
        html: buildEmailHtml(data),
        reply_to: data.contato.includes("@") ? data.contato : undefined,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(
        JSON.stringify({
          kind: "point_lead_email_failed",
          status: response.status,
          pointSlug: data.pointSlug,
          body,
        }),
      );
      throw new Error("point lead email failed");
    }

    return { ok: true, sentTo: toEmail } as const;
  });
