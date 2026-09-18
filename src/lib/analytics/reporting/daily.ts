import type { AnalyticsEventRecord, DailyPoint } from "./types.ts";

/**
 * Mesmo idioma já usado em `src/lib/player/content.ts` (`getPlayerClock`):
 * `Intl.DateTimeFormat("en-CA", { timeZone })` para obter `YYYY-MM-DD` num
 * fuso IANA arbitrário, sem depender de nenhuma biblioteca de datas nova
 * (o projeto só tem `date-fns` como dependência direta, sem `date-fns-tz`).
 */
function dateKeyInTimezone(isoTimestamp: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(isoTimestamp));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "0000";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

type DailyAccumulator = {
  events: number;
  sessions: Set<string>;
  visitors: Set<string>;
  qrLandings: number;
  pointViews: number;
  plannerStarts: number;
  plannerSubmits: number;
};

/**
 * Série diária, bucketizada no `timezone` informado (padrão do relatório
 * MOBTV: `America/Sao_Paulo`, definido em `report.ts`). `created_at` no
 * banco é `timestamptz`/UTC; a conversão para "dia local" acontece só aqui,
 * na apresentação — o FILTRO de período em `period.ts` é sempre por
 * instante absoluto, nunca por dia local, para não depender de timezone
 * para decidir se um evento entra ou não no relatório.
 *
 * Contagens por nome de evento (`qrLandings`/`pointViews`/`plannerStarts`/
 * `plannerSubmits`) são BRUTAS (nº de eventos naquele dia) — mesma lógica
 * do `overview`. `sessions`/`visitors` são sempre DISTINCT.
 */
export function computeDailySeries(rows: AnalyticsEventRecord[], timezone: string): DailyPoint[] {
  const byDate = new Map<string, DailyAccumulator>();

  for (const row of rows) {
    const date = dateKeyInTimezone(row.created_at, timezone);
    let bucket = byDate.get(date);
    if (!bucket) {
      bucket = {
        events: 0,
        sessions: new Set(),
        visitors: new Set(),
        qrLandings: 0,
        pointViews: 0,
        plannerStarts: 0,
        plannerSubmits: 0,
      };
      byDate.set(date, bucket);
    }

    bucket.events += 1;
    bucket.sessions.add(row.session_id);
    bucket.visitors.add(row.visitor_id);
    if (row.event_name === "qr_landing") bucket.qrLandings += 1;
    if (row.event_name === "point_view") bucket.pointViews += 1;
    if (row.event_name === "planner_start") bucket.plannerStarts += 1;
    if (row.event_name === "planner_submit") bucket.plannerSubmits += 1;
  }

  return [...byDate.entries()]
    .map(([date, bucket]) => ({
      date,
      events: bucket.events,
      sessions: bucket.sessions.size,
      visitors: bucket.visitors.size,
      qrLandings: bucket.qrLandings,
      pointViews: bucket.pointViews,
      plannerStarts: bucket.plannerStarts,
      plannerSubmits: bucket.plannerSubmits,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
