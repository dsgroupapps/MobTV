/** COUNT DISTINCT genérico — usado para session_id/visitor_id em todo o pacote de reporting. */
export function distinctCount<T>(values: Iterable<T>): number {
  return new Set(values).size;
}

/** `part/whole * 100`, ou `null` quando `whole <= 0` — nunca `Infinity`/`NaN`. */
export function safePercentage(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return (part / whole) * 100;
}
