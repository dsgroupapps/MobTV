import type { AnalyticsEventRecord } from "./types.ts";

/**
 * Regra CENTRALIZADA para identificar eventos de teste/validação manual —
 * nunca devem contaminar métricas de produção. Nunca apaga o evento bruto:
 * só o exclui das agregações por padrão (`includeTestEvents: true` inclui
 * de volta, ex. para depuração).
 *
 * Marcadores reconhecidos, em ordem de verificação:
 * 1. coluna `source === "analytics_block_a_validation"` — é onde o ÚNICO
 *    evento de teste que existe hoje em produção (validação manual do
 *    Bloco A, feita via `mapPointEventToRow` com `source:
 *    "analytics_block_a_validation"`) realmente gravou o marcador: na
 *    coluna `source`, não em `metadata`. Documentado aqui porque a prática
 *    real ficou diferente do que os dois marcadores abaixo previam.
 * 2. `metadata.test === true` — marcador recomendado para futuros eventos
 *    de teste gerados manualmente ou por scripts de validação.
 * 3. `metadata.source === "analytics_block_a_validation"` — mesmo texto do
 *    item 1, caso um evento futuro o grave dentro de `metadata` em vez da
 *    coluna `source`.
 */
const TEST_SOURCE_MARKER = "analytics_block_a_validation";

function metadataAsRecord(
  metadata: AnalyticsEventRecord["metadata"],
): Record<string, unknown> | null {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return null;
}

export function isTestEvent(row: Pick<AnalyticsEventRecord, "source" | "metadata">): boolean {
  if (row.source === TEST_SOURCE_MARKER) return true;

  const metadata = metadataAsRecord(row.metadata);
  if (metadata?.test === true) return true;
  if (metadata?.source === TEST_SOURCE_MARKER) return true;

  return false;
}

export function excludeTestEvents<T extends AnalyticsEventRecord>(rows: T[]): T[] {
  return rows.filter((row) => !isTestEvent(row));
}
