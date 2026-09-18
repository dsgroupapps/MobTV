import assert from "node:assert/strict";
import test from "node:test";

import { computePointPerformance } from "./points.ts";
import {
  sessionBreakdown,
  computeDeviceBreakdown,
  computeOsBreakdown,
  computeBrowserBreakdown,
  computeUtmSourceBreakdown,
} from "./breakdowns.ts";
import { row, qrJourney } from "./fixtures.test-support.ts";

test("points: atribui ao initial_point_slug (ponto de ORIGEM), não ao último ponto adicionado no planejador", () => {
  // Sessão que escaneou o QR do Hospital do Gama, mas dentro do planejador
  // adicionou TAMBÉM outro ponto (planner_point_add de um slug diferente).
  const journey = qrJourney({ sessionId: "s1", pointSlug: "hospital-do-gama" });
  const extraPointAdd = row({
    session_id: "s1",
    visitor_id: journey[0].visitor_id,
    source: "qr",
    initial_point_slug: "hospital-do-gama", // a ATRIBUIÇÃO da sessão continua sendo o ponto de origem
    event_name: "planner_point_add",
    point_slug: "outro-ponto-diferente", // o ponto ADICIONADO no planner é outro
  });

  const points = computePointPerformance([...journey, extraPointAdd]);

  assert.equal(
    points.length,
    1,
    "só existe 1 ponto de ORIGEM (initial_point_slug), mesmo com 2 point_slug distintos nos eventos",
  );
  assert.equal(points[0].pointSlug, "hospital-do-gama");
  assert.equal(
    points[0].plannerSubmit,
    1,
    "o submit é atribuído ao ponto de origem, não ao último ponto adicionado",
  );
});

test("points: eventos de domínio 'point' (sem initial_point_slug) nunca entram na lista", () => {
  const pointDomainRow = row({
    event_domain: "point",
    initial_point_slug: null,
    point_slug: "algum-ponto",
  });
  const points = computePointPerformance([pointDomainRow]);
  assert.deepEqual(points, []);
});

test("points: QR landings brutos vs sessões distintas (denominador da conversão)", () => {
  const rows = [
    ...qrJourney({ sessionId: "s1", pointSlug: "p1", upToStep: 1 }),
    row({ session_id: "s1", initial_point_slug: "p1", source: "qr", event_name: "qr_landing" }), // recarregou
    ...qrJourney({ sessionId: "s2", pointSlug: "p1", upToStep: 1 }),
  ];

  const [point] = computePointPerformance(rows);
  assert.equal(point.qrLandings, 3, "3 eventos qr_landing");
  assert.equal(point.qrLandingSessions, 2, "só 2 sessões distintas");
});

test("points: conversão QR -> planner e QR -> submit, com divisão por zero tratada", () => {
  const rows = [
    ...qrJourney({ sessionId: "s1", pointSlug: "p1" }), // completa tudo
    ...qrJourney({ sessionId: "s2", pointSlug: "p1", upToStep: 1 }), // só qr_landing
  ];

  const [point] = computePointPerformance(rows);
  assert.equal(point.qrLandingSessions, 2);
  assert.equal(point.plannerOpen, 1);
  assert.equal(point.plannerSubmit, 1);
  assert.equal(point.qrToPlannerRate, 50);
  assert.equal(point.qrToSubmitRate, 50);

  // Ponto sem NENHUM qr_landing (jornada iniciada sem source=qr, mas com
  // initial_point_slug de outra forma) -> denominador 0 -> null, não NaN/Infinity.
  const noQr = computePointPerformance([
    row({ session_id: "s3", initial_point_slug: "p2", source: null, event_name: "planner_open" }),
  ]);
  assert.equal(noQr[0].qrLandingSessions, 0);
  assert.equal(noQr[0].qrToPlannerRate, null);
  assert.equal(noQr[0].qrToSubmitRate, null);
});

test("points: ordenado por qrLandings decrescente", () => {
  const rows = [
    ...qrJourney({ sessionId: "s-low", pointSlug: "low", upToStep: 1 }),
    ...qrJourney({ sessionId: "s-high-1", pointSlug: "high", upToStep: 1 }),
    ...qrJourney({ sessionId: "s-high-2", pointSlug: "high", upToStep: 1 }),
  ];
  const points = computePointPerformance(rows);
  assert.deepEqual(
    points.map((p) => p.pointSlug),
    ["high", "low"],
  );
});

// ---------------------------------------------------------------------------
// breakdowns
// ---------------------------------------------------------------------------

test("sessionBreakdown: conta por SESSÃO, não por evento — sessão com muitos eventos não pesa mais", () => {
  const rows = [
    row({ session_id: "s1", device_type: "mobile" }),
    row({ session_id: "s1", device_type: "mobile" }),
    row({ session_id: "s1", device_type: "mobile" }),
    row({ session_id: "s2", device_type: "desktop" }),
  ];
  const breakdown = computeDeviceBreakdown(rows);
  const mobile = breakdown.find((b) => b.value === "mobile")!;
  const desktop = breakdown.find((b) => b.value === "desktop")!;
  assert.equal(mobile.sessions, 1, "s1 gerou 3 eventos mas conta como 1 sessão");
  assert.equal(desktop.sessions, 1);
  assert.equal(mobile.pct, 50);
  assert.equal(desktop.pct, 50);
});

test("sessionBreakdown: sessão sem valor conhecido cai em 'unknown', percentuais somam 100%", () => {
  const rows = [
    row({ session_id: "s1", device_type: "mobile" }),
    row({ session_id: "s2", device_type: null }),
  ];
  const breakdown = computeDeviceBreakdown(rows);
  const total = breakdown.reduce((sum, b) => sum + b.pct, 0);
  assert.ok(Math.abs(total - 100) < 1e-9);
  assert.ok(breakdown.some((b) => b.value === "unknown" && b.sessions === 1));
});

test("computeOsBreakdown / computeBrowserBreakdown: mesma lógica de sessão distinta", () => {
  const rows = [
    row({ session_id: "s1", os: "iOS", browser: "Safari" }),
    row({ session_id: "s1", os: "iOS", browser: "Safari" }),
    row({ session_id: "s2", os: "Android", browser: "Chrome" }),
  ];
  assert.equal(computeOsBreakdown(rows).find((b) => b.value === "iOS")!.sessions, 1);
  assert.equal(computeBrowserBreakdown(rows).find((b) => b.value === "Safari")!.sessions, 1);
});

test("UTM breakdown: só considera linhas de domínio 'point' (limitação documentada — funil não carrega UTM)", () => {
  const rows = [
    row({ event_domain: "point", session_id: "s1", utm_source: "flyer" }),
    row({ event_domain: "funnel", session_id: "s2", utm_source: null }), // funil nunca carrega UTM hoje
  ];
  const breakdown = computeUtmSourceBreakdown(rows.filter((r) => r.event_domain === "point"));
  assert.deepEqual(
    breakdown.map((b) => b.value),
    ["flyer"],
  );
});

test("breakdown de lista vazia não quebra", () => {
  assert.deepEqual(
    sessionBreakdown([], () => "x"),
    [],
  );
});
