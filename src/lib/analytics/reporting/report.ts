import type { AnalyticsEventRecord, AnalyticsReport, ReportOptions } from "./types.ts";
import { excludeTestEvents } from "./test-events.ts";
import { filterByRange, previousRange, compareOverview } from "./period.ts";
import { computeOverview } from "./overview.ts";
import { computeFunnel, computeQrFunnel } from "./funnel.ts";
import { computePointPerformance } from "./points.ts";
import {
  computeDeviceBreakdown,
  computeOsBreakdown,
  computeBrowserBreakdown,
  computeSourceBreakdown,
  computeInitialPointSlugBreakdown,
  computeQrIdBreakdown,
  computeUtmSourceBreakdown,
  computeUtmMediumBreakdown,
  computeUtmCampaignBreakdown,
} from "./breakdowns.ts";
import { computeDailySeries } from "./daily.ts";
import { computeInsights } from "./insights.ts";
import type { AnalyticsEventsRepository } from "./repository.ts";

/** Timezone de apresentação/agregação para o relatório MOBTV — só usado por `daily` (ver period.ts para por que o FILTRO [start,end) nunca depende de timezone). */
export const DEFAULT_REPORT_TIMEZONE = "America/Sao_Paulo";

/**
 * Núcleo PURO da camada de reporting: recebe linhas já buscadas (de onde
 * vierem — Supabase, fixture de teste, o que for) e devolve o relatório
 * completo. Nunca fala com rede/banco, por isso é 100% testável com
 * fixtures pequenas. `options.previousRows`, se informado, habilita
 * `comparison`; se omitido, `comparison` vem `null` (nunca compara sem
 * dado real do período anterior).
 */
export function buildAnalyticsReport(
  rows: AnalyticsEventRecord[],
  options: ReportOptions,
): AnalyticsReport {
  const range = { start: options.start, end: options.end };
  const timezone = options.timezone ?? DEFAULT_REPORT_TIMEZONE;
  const includeTestEvents = options.includeTestEvents ?? false;

  const inRange = filterByRange(rows, range);
  const scoped = includeTestEvents ? inRange : excludeTestEvents(inRange);
  const funnelRows = scoped.filter((r) => r.event_domain === "funnel");
  const pointRows = scoped.filter((r) => r.event_domain === "point");

  const overview = computeOverview(scoped);

  const report: AnalyticsReport = {
    range,
    timezone,
    includeTestEvents,
    overview,
    funnel: computeFunnel(funnelRows),
    qrFunnel: computeQrFunnel(funnelRows),
    points: computePointPerformance(funnelRows),
    devices: computeDeviceBreakdown(scoped),
    operatingSystems: computeOsBreakdown(scoped),
    browsers: computeBrowserBreakdown(scoped),
    sources: computeSourceBreakdown(funnelRows),
    initialPointSlugs: computeInitialPointSlugBreakdown(funnelRows),
    qrIds: computeQrIdBreakdown(funnelRows),
    utmSources: computeUtmSourceBreakdown(pointRows),
    utmMediums: computeUtmMediumBreakdown(pointRows),
    utmCampaigns: computeUtmCampaignBreakdown(pointRows),
    daily: computeDailySeries(scoped, timezone),
    comparison: null,
    insights: [],
  };

  if (options.previousRows) {
    const prevRange = previousRange(range);
    const previousInRange = filterByRange(options.previousRows, prevRange);
    const previousScoped = includeTestEvents ? previousInRange : excludeTestEvents(previousInRange);

    report.comparison = {
      previousRange: prevRange,
      ...compareOverview(overview, computeOverview(previousScoped)),
    };
  }

  report.insights = computeInsights(report);

  return report;
}

/**
 * Wrapper fino que busca as linhas do período atual E do período anterior
 * equivalente via um repositório, e delega tudo para `buildAnalyticsReport`.
 *
 * `options.includeTestEvents` é repassado ao `fetchEvents` do repositório
 * (Bloco C: o `EdgeFunctionAnalyticsEventsRepository` usa isso para já
 * pedir o filtro na origem) E TAMBÉM aplicado de novo aqui dentro de
 * `buildAnalyticsReport` — defesa em profundidade proposital: mesmo que o
 * filtro da Edge Function tenha uma lacuna, o filtro central do Bloco B
 * (`test-events.ts`) ainda protege o relatório.
 */
export async function buildAnalyticsReportForRange(
  repository: AnalyticsEventsRepository,
  options: Omit<ReportOptions, "previousRows">,
): Promise<AnalyticsReport> {
  const range = { start: options.start, end: options.end };
  const prevRange = previousRange(range);
  const fetchOptions = { includeTestEvents: options.includeTestEvents ?? false };

  const [rows, previousRows] = await Promise.all([
    repository.fetchEvents(range, fetchOptions),
    repository.fetchEvents(prevRange, fetchOptions),
  ]);

  return buildAnalyticsReport(rows, { ...options, previousRows });
}
