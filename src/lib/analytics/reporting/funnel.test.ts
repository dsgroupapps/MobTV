import assert from "node:assert/strict";
import test from "node:test";

import { computeFunnel, computeQrFunnel, qrOriginSessionIds } from "./funnel.ts";
import { FUNNEL_EVENT_NAMES } from "../types.ts";
import { row, qrJourney } from "./fixtures.test-support.ts";

test("funil geral: sessões DISTINCT por etapa, não contagem de eventos", () => {
  const rows = [
    ...qrJourney({ sessionId: "s1", pointSlug: "hospital-do-gama", upToStep: 2 }), // qr_landing, point_view
    row({ session_id: "s1", event_name: "qr_landing" }), // mesma sessão recarregou — não deve "dobrar"
  ];

  const funnel = computeFunnel(rows);
  const qrLandingStep = funnel.steps.find((s) => s.event === "qr_landing")!;
  assert.equal(
    qrLandingStep.sessions,
    1,
    "2 eventos qr_landing na mesma sessão contam como 1 sessão",
  );
});

test("funil geral: todas as 9 etapas de FUNNEL_EVENT_NAMES aparecem, na ordem", () => {
  const funnel = computeFunnel([]);
  assert.deepEqual(
    funnel.steps.map((s) => s.event),
    [...FUNNEL_EVENT_NAMES],
  );
});

test("funil geral: progressão %ofFirstStep e %ofPreviousStep calculadas corretamente", () => {
  const rows = [
    ...qrJourney({ sessionId: "s1", pointSlug: "p1" }), // completa as 9 etapas
    ...qrJourney({ sessionId: "s2", pointSlug: "p1" }), // completa as 9 etapas
    ...qrJourney({ sessionId: "s3", pointSlug: "p1", upToStep: 2 }), // só qr_landing + point_view
  ];

  const funnel = computeFunnel(rows);
  const [qrLanding, pointView] = funnel.steps;

  assert.equal(qrLanding.sessions, 3);
  assert.equal(qrLanding.pctOfFirstStep, 100);
  assert.equal(qrLanding.pctOfPreviousStep, null, "primeira etapa não tem anterior");

  assert.equal(pointView.sessions, 3);
  assert.equal(pointView.pctOfFirstStep, 100);
  assert.equal(pointView.pctOfPreviousStep, 100);

  const plannerSubmit = funnel.steps.find((s) => s.event === "planner_submit")!;
  assert.equal(plannerSubmit.sessions, 2);
  assert.ok(Math.abs(plannerSubmit.pctOfFirstStep! - (2 / 3) * 100) < 1e-9);
});

test("funil geral: etapa com 0 sessões na primeira etapa não gera NaN/Infinity nas seguintes (divisão por zero tratada)", () => {
  const rows = [row({ event_name: "planner_open", session_id: "s1" })]; // pula qr_landing e point_view

  const funnel = computeFunnel(rows);
  const [qrLanding, pointView, siteContinue] = funnel.steps;

  assert.equal(qrLanding.sessions, 0);
  assert.equal(qrLanding.pctOfFirstStep, null);
  assert.equal(pointView.pctOfFirstStep, null, "0/0 nunca vira NaN, vira null");
  assert.equal(siteContinue.pctOfPreviousStep, null);

  for (const step of funnel.steps) {
    if (step.pctOfFirstStep !== null) assert.equal(Number.isFinite(step.pctOfFirstStep), true);
    if (step.pctOfPreviousStep !== null)
      assert.equal(Number.isFinite(step.pctOfPreviousStep), true);
  }
});

test("qrOriginSessionIds: só sessões de funil com source === 'qr'", () => {
  const rows = [
    row({ session_id: "s-qr", source: "qr", event_name: "qr_landing" }),
    row({ session_id: "s-organic", source: null, event_name: "planner_open" }),
    row({ session_id: "s-organic", source: null, event_name: "planner_start" }),
  ];
  const qrSessions = qrOriginSessionIds(rows);
  assert.deepEqual([...qrSessions], ["s-qr"]);
});

test("funil QR: só sessões cujo first-touch veio de QR — funil geral não é afetado por tráfego orgânico direto", () => {
  const rows = [
    ...qrJourney({ sessionId: "s-qr-1", pointSlug: "p1" }),
    // sessão orgânica: chega direto no planner, sem qr_landing nem source=qr
    row({ session_id: "s-organic", source: null, event_name: "planner_open" }),
    row({ session_id: "s-organic", source: null, event_name: "planner_start" }),
  ];

  const general = computeFunnel(rows);
  const qr = computeQrFunnel(rows);

  const generalPlannerOpen = general.steps.find((s) => s.event === "planner_open")!;
  const qrPlannerOpen = qr.steps.find((s) => s.event === "planner_open")!;

  assert.equal(generalPlannerOpen.sessions, 2, "geral inclui a sessão orgânica");
  assert.equal(qrPlannerOpen.sessions, 1, "funil QR exclui a sessão orgânica");
  assert.equal(qr.totalSessions, 1);
});

test("funil QR de dados vazios não quebra (0 sessões, sem NaN)", () => {
  const qr = computeQrFunnel([]);
  assert.equal(qr.totalSessions, 0);
  for (const step of qr.steps) {
    assert.equal(step.sessions, 0);
  }
});
