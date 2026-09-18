import "@tanstack/react-start/server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";
import { getConfiguredSupabaseUrl } from "../supabase.ts";
import type { AnalyticsEventRecord, DateRange } from "./types.ts";

export type FetchEventsOptions = {
  /** default `false`. Repassado à origem dos dados (Edge Function) quando ela suportar o filtro — NUNCA substitui o filtro central do Bloco B (`excludeTestEvents` em `report.ts`), que roda de qualquer forma. Defesa em profundidade proposital. */
  includeTestEvents?: boolean;
};

export interface AnalyticsEventsRepository {
  fetchEvents(range: DateRange, options?: FetchEventsOptions): Promise<AnalyticsEventRecord[]>;
}

// ===========================================================================
// Implementação LIVE recomendada: Edge Function privada (Bloco C)
// ===========================================================================

const EDGE_FUNCTION_PATH = "/functions/v1/get-analytics-events";
const DEFAULT_PAGE_LIMIT = 1_000;
/** Limite documentado do endpoint — não é uma escolha nossa, é a restrição real do `get-analytics-events`. */
const MAX_WINDOW_DAYS = 92;
const MAX_WINDOW_MS = MAX_WINDOW_DAYS * 24 * 60 * 60 * 1000;
/** Cinto de segurança contra loop infinito mesmo se a detecção de cursor repetido falhar por algum motivo — nenhuma janela real chega perto disso com limit=1000. */
const MAX_PAGES_PER_WINDOW = 10_000;
/** Corta o corpo de uma resposta de erro antes de colocá-lo na mensagem — nunca queremos um payload gigante (ou, por acidente, algo sensível) num log. */
const MAX_ERROR_BODY_LENGTH = 300;

/**
 * Erro desta integração — nunca, em nenhuma circunstância, inclui o valor de
 * `ANALYTICS_API_KEY` (nem no `message`, nem em `cause`: `cause` só recebe o
 * erro original de rede/parse, nunca a request/headers).
 */
export class AnalyticsEdgeFunctionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AnalyticsEdgeFunctionError";
  }
}

function readAnalyticsApiKey(): string | undefined {
  // Deliberadamente SÓ process.env — nunca import.meta.env.VITE_*, que
  // vazaria para o bundle do browser. Sem essa variável (server-only,
  // nunca VITE_ANALYTICS_API_KEY), esta implementação não funciona — por
  // design, não por descuido.
  return typeof process !== "undefined" ? process.env.ANALYTICS_API_KEY : undefined;
}

function buildDefaultEndpointUrl(): string | undefined {
  const supabaseUrl = getConfiguredSupabaseUrl();
  if (!supabaseUrl) return undefined;
  return `${supabaseUrl.replace(/\/+$/, "")}${EDGE_FUNCTION_PATH}`;
}

function truncateForError(text: string): string {
  return text.length > MAX_ERROR_BODY_LENGTH ? `${text.slice(0, MAX_ERROR_BODY_LENGTH)}…` : text;
}

/**
 * [start, end) dividido em janelas consecutivas de no máximo
 * `MAX_WINDOW_DAYS` dias — o limite real do endpoint. Cada janela usa o
 * `end` da anterior como seu próprio `start`: sem buraco, sem sobreposição.
 * Não altera o significado de [start,end) do Bloco B, só fatia o mesmo
 * intervalo em pedaços que o endpoint aceita.
 */
export function splitIntoWindows(range: DateRange): DateRange[] {
  const endMs = range.end.getTime();
  let cursor = range.start.getTime();
  if (cursor >= endMs) return [];

  const windows: DateRange[] = [];
  while (cursor < endMs) {
    const windowEndMs = Math.min(cursor + MAX_WINDOW_MS, endMs);
    windows.push({ start: new Date(cursor), end: new Date(windowEndMs) });
    cursor = windowEndMs;
  }
  return windows;
}

/**
 * Validação mínima da resposta — não confia cegamente no JSON externo, mas
 * também não reimplementa o schema inteiro de `analytics_events`: exige só
 * os campos ESTRUTURAIS não-nuláveis (id/created_at/event_name/
 * event_domain/visitor_id/session_id) para aceitar uma linha como
 * `AnalyticsEventRecord`; os demais campos passam como estão (`.passthrough`),
 * já que são todos nuláveis no schema real. Usa `zod`, já uma dependência do
 * projeto — sem biblioteca nova só para isto.
 */
const analyticsEventRowSchema = z
  .object({
    id: z.string(),
    created_at: z.string(),
    event_name: z.string(),
    event_domain: z.string(),
    visitor_id: z.string(),
    session_id: z.string(),
  })
  .passthrough();

const edgeFunctionResponseSchema = z.object({
  rows: z.array(analyticsEventRowSchema),
  nextCursor: z.string().nullable().optional(),
  hasMore: z.boolean(),
});

type EdgeFunctionPage = {
  rows: AnalyticsEventRecord[];
  nextCursor: string | null;
  hasMore: boolean;
};

function parseEdgeFunctionResponse(json: unknown): EdgeFunctionPage {
  const parsed = edgeFunctionResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new AnalyticsEdgeFunctionError(
      `Resposta malformada de get-analytics-events: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  }
  return {
    rows: parsed.data.rows as AnalyticsEventRecord[],
    nextCursor: parsed.data.nextCursor ?? null,
    hasMore: parsed.data.hasMore,
  };
}

async function requestPage(params: {
  endpointUrl: string;
  apiKey: string;
  fetchImpl: typeof fetch;
  window: DateRange;
  includeTestEvents: boolean;
  cursor: string | null;
  limit: number;
}): Promise<EdgeFunctionPage> {
  let response: Response;
  try {
    response = await params.fetchImpl(params.endpointUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-analytics-api-key": params.apiKey,
      },
      body: JSON.stringify({
        start: params.window.start.toISOString(),
        end: params.window.end.toISOString(),
        includeTestEvents: params.includeTestEvents,
        limit: params.limit,
        cursor: params.cursor,
      }),
    });
  } catch (error) {
    throw new AnalyticsEdgeFunctionError(
      `Falha de rede ao chamar get-analytics-events: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new AnalyticsEdgeFunctionError(
      `get-analytics-events rejeitou a credencial (HTTP ${response.status}) — verifique se ANALYTICS_API_KEY está configurada corretamente neste ambiente.`,
    );
  }
  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new AnalyticsEdgeFunctionError(
      `get-analytics-events respondeu HTTP ${response.status}${bodyText ? `: ${truncateForError(bodyText)}` : ""}`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    throw new AnalyticsEdgeFunctionError(
      "get-analytics-events retornou um corpo que não é JSON válido.",
      { cause: error },
    );
  }

  return parseEdgeFunctionResponse(json);
}

/**
 * Pagina UMA janela até `hasMore` virar `false`, protegendo contra: cursor
 * repetido, `hasMore:true` sem `nextCursor`, e um número absurdo de páginas
 * (cinto de segurança final). Qualquer um desses estados vira um erro claro
 * — nunca um loop infinito, nunca dados truncados silenciosamente.
 */
async function fetchWindowAllPages(params: {
  endpointUrl: string;
  apiKey: string;
  fetchImpl: typeof fetch;
  window: DateRange;
  includeTestEvents: boolean;
  limit: number;
}): Promise<AnalyticsEventRecord[]> {
  const rows: AnalyticsEventRecord[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;
  let pages = 0;

  while (true) {
    const page = await requestPage({ ...params, cursor });
    rows.push(...page.rows);

    if (!page.hasMore) break;

    if (page.nextCursor == null) {
      throw new AnalyticsEdgeFunctionError(
        "get-analytics-events retornou hasMore=true sem nextCursor — resposta inconsistente, abortando paginação.",
      );
    }
    if (page.nextCursor === cursor || seenCursors.has(page.nextCursor)) {
      throw new AnalyticsEdgeFunctionError(
        "get-analytics-events retornou um cursor repetido — abortando para evitar loop infinito.",
      );
    }
    seenCursors.add(page.nextCursor);
    cursor = page.nextCursor;

    pages += 1;
    if (pages > MAX_PAGES_PER_WINDOW) {
      throw new AnalyticsEdgeFunctionError(
        `get-analytics-events excedeu ${MAX_PAGES_PER_WINDOW} páginas numa única janela — abortando.`,
      );
    }
  }

  return rows;
}

export type EdgeFunctionRepositoryOptions = {
  /** default: `process.env.ANALYTICS_API_KEY` (nunca lido de `VITE_*`). */
  apiKey?: string;
  /** default: `${SUPABASE_URL}/functions/v1/get-analytics-events`, montada a partir da mesma env que o resto do servidor já usa (`getConfiguredSupabaseUrl`). */
  endpointUrl?: string;
  /** Injeção para testes — nunca chamado de verdade nos testes automatizados deste pacote. */
  fetchImpl?: typeof fetch;
  /** default 1000. */
  pageLimit?: number;
};

/**
 * Implementação LIVE recomendada de `AnalyticsEventsRepository`, via a Edge
 * Function privada `get-analytics-events` (Lovable Cloud) — NÃO consulta
 * `analytics_events` diretamente, então não depende de RLS/SELECT público.
 *
 * Responsabilidade estritamente de TRANSPORTE: monta a request, autentica,
 * pagina, valida minimamente a resposta e devolve linhas cruas. Nenhuma
 * métrica/funil/percentual/ranking/insight é calculado aqui — isso é sempre
 * `buildAnalyticsReport`/`buildAnalyticsReportForRange` (Bloco B).
 *
 * Fluxo: `Mobtv_site server -> Edge Function privada -> analytics_events ->
 * rows -> este repository -> buildAnalyticsReportForRange -> relatório`.
 */
export function createEdgeFunctionAnalyticsEventsRepository(
  options: EdgeFunctionRepositoryOptions = {},
): AnalyticsEventsRepository {
  const fetchImpl = options.fetchImpl ?? fetch;
  const pageLimit = options.pageLimit ?? DEFAULT_PAGE_LIMIT;

  return {
    async fetchEvents(range, fetchOptions): Promise<AnalyticsEventRecord[]> {
      const apiKey = options.apiKey ?? readAnalyticsApiKey();
      if (!apiKey) {
        throw new AnalyticsEdgeFunctionError(
          "ANALYTICS_API_KEY não está configurada neste ambiente (server-only) — impossível consultar get-analytics-events.",
        );
      }

      const endpointUrl = options.endpointUrl ?? buildDefaultEndpointUrl();
      if (!endpointUrl) {
        throw new AnalyticsEdgeFunctionError(
          "Não foi possível montar a URL da Edge Function: SUPABASE_URL/VITE_SUPABASE_URL não configurada.",
        );
      }

      const includeTestEvents = fetchOptions?.includeTestEvents ?? false;
      const windows = splitIntoWindows(range);

      const allRows: AnalyticsEventRecord[] = [];
      for (const window of windows) {
        const windowRows = await fetchWindowAllPages({
          endpointUrl,
          apiKey,
          fetchImpl,
          window,
          includeTestEvents,
          limit: pageLimit,
        });
        allRows.push(...windowRows);
      }
      return allRows;
    },
  };
}

// ===========================================================================
// Implementação Supabase direto — NÃO É O CAMINHO LIVE (ver aviso abaixo)
// ===========================================================================

/**
 * @deprecated NÃO é o caminho recomendado para produção — mantida só para
 * os testes já existentes do Bloco B e como referência histórica de por que
 * essa abordagem não funciona. Use `createEdgeFunctionAnalyticsEventsRepository`
 * para dados LIVE.
 *
 * Motivo: precisa de um `SupabaseClient` cujo papel tenha SELECT em
 * `analytics_events`. A policy de RLS criada no Bloco A
 * (`supabase/migrations/20260917000000_create_analytics_events.sql`) só
 * concede INSERT para `anon`/`authenticated` — não existe policy de SELECT.
 * `getAnalyticsSupabaseClient()` (Bloco A, `src/lib/analytics/supabase.ts`)
 * usa a publishable/anon key; passá-la aqui SEMPRE resulta num erro de
 * permissão do Postgrest, nunca em dados. Nenhuma alteração de RLS foi
 * feita para "consertar" isso — a leitura LIVE passou a ser a Edge Function
 * acima, que roda com privilégio elevado do lado do Lovable Cloud sem
 * expor esse privilégio a este servidor.
 */
export function createSupabaseAnalyticsEventsRepository(
  client: SupabaseClient<Database>,
): AnalyticsEventsRepository {
  return {
    async fetchEvents(range: DateRange): Promise<AnalyticsEventRecord[]> {
      const { data, error } = await client
        .from("analytics_events")
        .select("*")
        .gte("created_at", range.start.toISOString())
        .lt("created_at", range.end.toISOString());

      if (error) {
        throw new Error(
          `Falha ao ler analytics_events (${error.code ?? "sem código"}): ${error.message}`,
        );
      }
      return data ?? [];
    },
  };
}

// ===========================================================================
// Implementação em memória — testes e qualquer chamador que já tenha as
// linhas em mão.
// ===========================================================================

export function createInMemoryAnalyticsEventsRepository(
  rows: AnalyticsEventRecord[],
): AnalyticsEventsRepository {
  return {
    async fetchEvents(range: DateRange): Promise<AnalyticsEventRecord[]> {
      const startMs = range.start.getTime();
      const endMs = range.end.getTime();
      return rows.filter((row) => {
        const ts = new Date(row.created_at).getTime();
        return ts >= startMs && ts < endMs;
      });
    },
  };
}
