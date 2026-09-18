import type { AnalyticsEventRecord, DateRange } from "./types.ts";
import { filterByRange } from "./period.ts";
import { isTestEvent } from "./test-events.ts";

/**
 * Lista EXPLÍCITA de campos exportáveis (não um passthrough do row inteiro)
 * — mesmo não havendo hoje nenhuma coluna de PII em `analytics_events`
 * (Bloco A nunca grava nome/e-mail/telefone/IP bruto/user-agent bruto), uma
 * coluna nova adicionada no futuro só entra no export se alguém adicionar
 * deliberadamente aqui. Defesa em profundidade, não redundância boba.
 */
export const RAW_EXPORT_FIELDS = [
  "id",
  "created_at",
  "event_name",
  "event_domain",
  "visitor_id",
  "session_id",
  "source",
  "initial_point_slug",
  "point_slug",
  "qr_id",
  "landing_path",
  "category_key",
  "media_type",
  "planning_intent",
  "device_type",
  "os",
  "browser",
  "language",
  "timezone",
  "viewport_width",
  "viewport_height",
  "screen_width",
  "screen_height",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "scroll_depth_percent",
  "country_code",
  "metadata",
] as const satisfies readonly (keyof AnalyticsEventRecord)[];

export type RawExportRow = Pick<AnalyticsEventRecord, (typeof RAW_EXPORT_FIELDS)[number]>;

export type RawExportOptions = DateRange & {
  /** default `false` — eventos de teste (ver `test-events.ts`) ficam de fora a menos que explicitamente pedidos. */
  includeTestEvents?: boolean;
};

/**
 * Prepara os eventos brutos de um período para o futuro export em CSV do
 * Bloco C. NÃO gera CSV aqui — só filtra por `[start,end)`, exclui teste
 * por padrão e projeta os campos permitidos. Sem PII por construção (a
 * tabela não tem coluna de PII; a lista explícita acima é o cinto de
 * segurança adicional).
 */
export function selectRawAnalyticsEvents(
  rows: AnalyticsEventRecord[],
  options: RawExportOptions,
): RawExportRow[] {
  const inRange = filterByRange(rows, { start: options.start, end: options.end });
  const scoped = options.includeTestEvents ? inRange : inRange.filter((row) => !isTestEvent(row));

  return scoped.map((row) => {
    const picked = {} as Record<string, unknown>;
    for (const field of RAW_EXPORT_FIELDS) {
      picked[field] = row[field];
    }
    return picked as RawExportRow;
  });
}
