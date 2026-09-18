/**
 * Camada de agregação/funil/insights sobre `analytics_events` (Bloco B).
 * Não altera a instrumentação (Bloco A) nem lê/escreve nada sozinha — tudo
 * aqui é puro (opera sobre `AnalyticsEventRecord[]` já buscadas) exceto
 * `repository.ts`, que define como buscar essas linhas do Supabase quando
 * houver credencial de leitura (ver esse arquivo para a lacuna atual).
 *
 * Uso típico (Bloco C):
 *   const report = await buildAnalyticsReportForRange(repository, {
 *     start, end, timezone: "America/Sao_Paulo",
 *   });
 */
export * from "./types.ts";
export * from "./test-events.ts";
export * from "./overview.ts";
export * from "./funnel.ts";
export * from "./points.ts";
export * from "./breakdowns.ts";
export * from "./daily.ts";
export * from "./period.ts";
export * from "./insights.ts";
export * from "./raw-events.ts";
export * from "./repository.ts";
export * from "./report.ts";
