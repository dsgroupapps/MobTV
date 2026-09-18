import type { Database } from "@/lib/supabase/database.types";

/**
 * Uma linha de `analytics_events`, exatamente como persistida pelo Bloco A
 * (`src/lib/analytics/persistence.ts` + a migration
 * `supabase/migrations/20260917000000_create_analytics_events.sql`).
 * Fonte de verdade única do schema — reaproveita o tipo já gerado para a
 * tabela, sem redefinir campos à mão.
 */
export type AnalyticsEventRecord = Database["public"]["Tables"]["analytics_events"]["Row"];

/**
 * Intervalo [start, end) em INSTANTES ABSOLUTOS (a coluna `created_at` é
 * `timestamptz`) — start inclusive, end exclusivo. Essa escolha evita dupla
 * contagem entre relatórios consecutivos: o `end` de uma semana é
 * exatamente o `start` da próxima. Timezone NUNCA entra nesse filtro — só
 * afeta como os dias são rotulados em `daily` (ver `daily.ts`).
 */
export type DateRange = { start: Date; end: Date };

export type ReportOptions = {
  start: Date;
  end: Date;
  /** IANA, ex. "America/Sao_Paulo" — timezone de apresentação para `daily`. Não altera o filtro [start,end), que é sempre por instante absoluto. */
  timezone?: string;
  /** default `false` — eventos marcados como teste (ver `test-events.ts`) nunca entram nas agregações por padrão. */
  includeTestEvents?: boolean;
  /**
   * Linhas do período anterior equivalente (mesma duração, imediatamente
   * antes de `start`). Se informado, o relatório inclui `comparison`; se
   * omitido, `comparison` vem `null` (nunca inventa uma comparação sem
   * dado).
   */
  previousRows?: AnalyticsEventRecord[];
};

export type Overview = {
  /** COUNT(*) de todas as linhas válidas (não-teste) no período. */
  events: number;
  /** COUNT DISTINCT session_id. */
  sessions: number;
  /** COUNT DISTINCT visitor_id — navegador identificado, não pessoa física garantida. */
  visitors: number;
  /** COUNT(*) de event_name = "qr_landing" — contagem de EVENTOS, não de pessoas/sessões únicas. */
  qrLandings: number;
  /** COUNT(*) de event_name = "point_view" (domínio "funnel") — métrica canônica de abertura de /ponto/$slug. Ver funnel.ts/overview.ts para a justificativa de não somar point_profile_view aqui. */
  pointViews: number;
};

export type FunnelStepResult = {
  event: string;
  label: string;
  /** COUNT DISTINCT session_id que geraram esse evento no escopo do funil (geral ou QR). */
  sessions: number;
  /** sessions / sessions-da-primeira-etapa. `null` só quando a primeira etapa tem 0 sessões (não dá para dividir por zero). */
  pctOfFirstStep: number | null;
  /** sessions / sessions-da-etapa-anterior. `null` na primeira etapa (não há anterior) ou quando a etapa anterior tem 0 sessões. */
  pctOfPreviousStep: number | null;
};

export type FunnelResult = {
  /** COUNT DISTINCT session_id entre TODAS as linhas de funil no escopo (não é a soma das etapas — uma sessão pode aparecer em várias etapas). */
  totalSessions: number;
  steps: FunnelStepResult[];
};

export type PointPerformance = {
  /** `initial_point_slug` — o ponto de ORIGEM da jornada, nunca o último ponto adicionado no planejador. */
  pointSlug: string;
  /** COUNT(*) de qr_landing com esse initial_point_slug — evento bruto, igual à definição do overview. */
  qrLandings: number;
  /** COUNT DISTINCT session_id entre os qr_landing acima — usado como denominador das taxas de conversão abaixo. */
  qrLandingSessions: number;
  /** COUNT DISTINCT session_id entre TODAS as linhas de funil com esse initial_point_slug (jornadas que se originaram nesse ponto, com ou sem QR). */
  sessions: number;
  visitors: number;
  pointViews: number;
  siteContinue: number;
  plannerOpen: number;
  plannerStart: number;
  plannerSummaryView: number;
  plannerSubmit: number;
  /** plannerOpen / qrLandingSessions, em %. `null` se qrLandingSessions = 0. */
  qrToPlannerRate: number | null;
  /** plannerSubmit / qrLandingSessions, em %. `null` se qrLandingSessions = 0. */
  qrToSubmitRate: number | null;
};

export type BreakdownEntry = {
  /** Valor observado, ou "unknown" quando a sessão não tem esse dado em nenhuma linha do escopo. */
  value: string;
  /** COUNT DISTINCT session_id — nunca contagem de eventos (ver breakdowns.ts). */
  sessions: number;
  /** sessions / total-de-sessões-do-escopo, em %. Sempre soma ~100% entre todas as entradas (incluindo "unknown"). */
  pct: number;
};

export type DailyPoint = {
  /** YYYY-MM-DD no timezone do relatório. */
  date: string;
  /** COUNT(*) bruto do dia. */
  events: number;
  /** COUNT DISTINCT session_id do dia. */
  sessions: number;
  /** COUNT DISTINCT visitor_id do dia. */
  visitors: number;
  /** COUNT(*) bruto de qr_landing do dia. */
  qrLandings: number;
  /** COUNT(*) bruto de point_view do dia. */
  pointViews: number;
  /** COUNT(*) bruto de planner_start do dia. */
  plannerStarts: number;
  /** COUNT(*) bruto de planner_submit do dia. */
  plannerSubmits: number;
};

export type MetricComparison = {
  current: number;
  previous: number;
  absoluteChange: number;
  /** `(current-previous)/previous * 100`. `null` quando `previous === 0` (não é matematicamente definido) — nunca `Infinity`/`NaN`. */
  percentChange: number | null;
};

export type PeriodComparison = {
  previousRange: DateRange;
  events: MetricComparison;
  sessions: MetricComparison;
  visitors: MetricComparison;
  qrLandings: MetricComparison;
  pointViews: MetricComparison;
};

export type Insight = {
  key: string;
  /** Frase factual, sem causalidade inferida — ex. "iOS representou 61% das sessões no período." */
  text: string;
};

export type AnalyticsReport = {
  range: DateRange;
  timezone: string;
  includeTestEvents: boolean;
  overview: Overview;
  /** Todas as sessões, independente da origem (ver funnel.ts). */
  funnel: FunnelResult;
  /** Só sessões cujo first-touch veio de QR (source === "qr") — ver funnel.ts:qrOriginSessionIds. */
  qrFunnel: FunnelResult;
  points: PointPerformance[];
  devices: BreakdownEntry[];
  operatingSystems: BreakdownEntry[];
  browsers: BreakdownEntry[];
  sources: BreakdownEntry[];
  initialPointSlugs: BreakdownEntry[];
  qrIds: BreakdownEntry[];
  /** Ver breakdowns.ts — UTM só existe em eventos de domínio "point" hoje; limitação documentada, não contornada. */
  utmSources: BreakdownEntry[];
  utmMediums: BreakdownEntry[];
  utmCampaigns: BreakdownEntry[];
  daily: DailyPoint[];
  /** `null` quando `previousRows` não foi informado ao `buildAnalyticsReport`. */
  comparison: PeriodComparison | null;
  insights: Insight[];
};
