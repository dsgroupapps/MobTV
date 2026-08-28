import assert from "node:assert/strict";
import test from "node:test";

import { getPlayerClock, selectPlayerContent } from "./content.ts";

const paid = {
  id: "paid",
  storagePath: "customer/paid.mp4",
  type: "video/mp4",
  durationSeconds: 30,
  scheduledDate: "2026-08-28",
  startTime: "12:00:00",
  orderItemId: "item",
};

const globalFiller = {
  id: "global-filler",
  storagePath: "filler/global.jpg",
  type: "image/jpeg",
  durationSeconds: 15,
  panelIds: [],
};

test("prioriza conteúdo pago dentro do horário contratado", () => {
  const result = selectPlayerContent([paid], [globalFiller], "panel-a", {
    date: "2026-08-28",
    seconds: 12 * 3_600 + 15,
  });
  assert.deepEqual(
    result.map((item) => item.source),
    ["paid"],
  );
});

test("usa filler global e específico quando não há conteúdo pago ativo", () => {
  const result = selectPlayerContent(
    [paid],
    [globalFiller, { ...globalFiller, id: "panel-filler", panelIds: ["panel-a"] }],
    "panel-a",
    { date: "2026-08-28", seconds: 13 * 3_600 },
  );
  assert.deepEqual(
    result.map((item) => item.id),
    ["global-filler", "panel-filler"],
  );
});

test("não seleciona filler destinado a outro painel", () => {
  const result = selectPlayerContent([], [{ ...globalFiller, panelIds: ["panel-b"] }], "panel-a", {
    date: "2026-08-28",
    seconds: 0,
  });
  assert.equal(result.length, 0);
});

test("calcula data e hora no fuso do painel", () => {
  assert.deepEqual(getPlayerClock(new Date("2026-08-29T01:30:00.000Z"), "America/Sao_Paulo"), {
    date: "2026-08-28",
    seconds: 22 * 3_600 + 30 * 60,
  });
});
