import assert from "node:assert/strict";
import test from "node:test";

import { computeOverview } from "./overview.ts";
import { computeDailySeries } from "./daily.ts";
import { row } from "./fixtures.test-support.ts";

test("eventos totais: COUNT(*) de todas as linhas recebidas", () => {
  const rows = [row(), row(), row({ event_name: "point_maps_click" })];
  assert.equal(computeOverview(rows).events, 3);
});

test("sessões: COUNT DISTINCT session_id", () => {
  const rows = [row({ session_id: "s1" }), row({ session_id: "s1" }), row({ session_id: "s2" })];
  assert.equal(computeOverview(rows).sessions, 2);
});

test("visitantes: COUNT DISTINCT visitor_id", () => {
  const rows = [
    row({ visitor_id: "v1", session_id: "s1" }),
    row({ visitor_id: "v1", session_id: "s2" }), // mesmo visitante, outra sessão
    row({ visitor_id: "v2", session_id: "s3" }),
  ];
  assert.equal(computeOverview(rows).visitors, 2);
});

test("QR landings: COUNT(*) de qr_landing — evento bruto, não sessão/pessoa única", () => {
  const rows = [
    row({ event_name: "qr_landing", session_id: "s1" }),
    row({ event_name: "qr_landing", session_id: "s1" }), // mesma sessão recarregou a página
    row({ event_name: "point_view", session_id: "s1" }),
  ];
  assert.equal(computeOverview(rows).qrLandings, 2, "conta os 2 eventos, não 1 sessão");
});

test("point views: conta só point_view (domínio funnel), NUNCA soma point_profile_view (domínio point) — não duplica a mesma abertura de página", () => {
  const rows = [
    row({ event_name: "point_view", event_domain: "funnel", session_id: "s1" }),
    row({ event_name: "point_profile_view", event_domain: "point", session_id: "s1" }),
  ];
  const overview = computeOverview(rows);
  assert.equal(overview.pointViews, 1, "só o point_view entra na métrica canônica");
  assert.equal(overview.events, 2, "mas os dois contam para o total de eventos");
});

test("overview de lista vazia nunca retorna NaN/Infinity — tudo zero", () => {
  const overview = computeOverview([]);
  assert.deepEqual(overview, { events: 0, sessions: 0, visitors: 0, qrLandings: 0, pointViews: 0 });
  for (const value of Object.values(overview)) {
    assert.equal(Number.isFinite(value), true);
  }
});

test("daily: agrega por dia no timezone informado, contagens de evento são brutas, sessions/visitors são distinct", () => {
  // 2026-09-08T23:30:00-03:00 = 2026-09-09T02:30:00Z — em UTC cai em outro
  // dia; no timezone America/Sao_Paulo, ainda é dia 08.
  const rows = [
    row({
      created_at: "2026-09-09T02:30:00.000Z",
      session_id: "s1",
      visitor_id: "v1",
      event_name: "qr_landing",
    }),
    row({
      created_at: "2026-09-09T02:59:00.000Z",
      session_id: "s1",
      visitor_id: "v1",
      event_name: "point_view",
    }),
    row({
      created_at: "2026-09-09T13:00:00.000Z",
      session_id: "s2",
      visitor_id: "v2",
      event_name: "planner_start",
    }),
  ];

  const daily = computeDailySeries(rows, "America/Sao_Paulo");

  assert.equal(daily.length, 2);
  const [day1, day2] = daily;
  assert.equal(day1.date, "2026-09-08");
  assert.equal(day1.events, 2);
  assert.equal(day1.sessions, 1);
  assert.equal(day1.visitors, 1);
  assert.equal(day1.qrLandings, 1);
  assert.equal(day1.pointViews, 1);

  assert.equal(day2.date, "2026-09-09");
  assert.equal(day2.plannerStarts, 1);
});

test("daily: mesmo instante, timezones diferentes podem cair em dias diferentes (respeita timezone)", () => {
  const rows = [row({ created_at: "2026-09-09T02:30:00.000Z" })];

  const saoPaulo = computeDailySeries(rows, "America/Sao_Paulo");
  const utc = computeDailySeries(rows, "UTC");

  assert.equal(saoPaulo[0].date, "2026-09-08");
  assert.equal(utc[0].date, "2026-09-09");
});

test("daily: dias vêm ordenados cronologicamente", () => {
  const rows = [
    row({ created_at: "2026-09-10T12:00:00.000Z" }),
    row({ created_at: "2026-09-08T12:00:00.000Z" }),
    row({ created_at: "2026-09-09T12:00:00.000Z" }),
  ];
  const daily = computeDailySeries(rows, "UTC");
  assert.deepEqual(
    daily.map((d) => d.date),
    ["2026-09-08", "2026-09-09", "2026-09-10"],
  );
});

test("daily de lista vazia é lista vazia, sem NaN", () => {
  assert.deepEqual(computeDailySeries([], "America/Sao_Paulo"), []);
});
