import assert from "node:assert/strict";
import test from "node:test";

import { isTestEvent, excludeTestEvents } from "./test-events.ts";
import { selectRawAnalyticsEvents, RAW_EXPORT_FIELDS } from "./raw-events.ts";
import { row } from "./fixtures.test-support.ts";

test("isTestEvent: reconhece o marcador real gravado pelo Bloco A (coluna source)", () => {
  assert.equal(isTestEvent(row({ source: "analytics_block_a_validation" })), true);
});

test("isTestEvent: reconhece metadata.test === true", () => {
  assert.equal(isTestEvent(row({ metadata: { test: true } })), true);
});

test("isTestEvent: reconhece metadata.source === marcador", () => {
  assert.equal(isTestEvent(row({ metadata: { source: "analytics_block_a_validation" } })), true);
});

test("isTestEvent: evento real (sem nenhum marcador) não é teste", () => {
  assert.equal(
    isTestEvent(row({ source: "qr", metadata: { pointName: "Estação Central" } })),
    false,
  );
});

test("isTestEvent: metadata.test com valor não-booleano ('true' string) NÃO conta — só true literal", () => {
  assert.equal(isTestEvent(row({ metadata: { test: "true" } })), false);
});

test("excludeTestEvents: remove só as linhas marcadas, preserva as demais e a ordem", () => {
  const real1 = row({ id: "r1", source: "qr" });
  const testRow = row({ id: "t1", source: "analytics_block_a_validation" });
  const real2 = row({ id: "r2", source: null });

  const filtered = excludeTestEvents([real1, testRow, real2]);
  assert.deepEqual(
    filtered.map((r) => r.id),
    ["r1", "r2"],
  );
});

test("excludeTestEvents: nunca 'apaga' nada — só filtra o array recebido, não muta as linhas originais", () => {
  const rows = [row({ id: "a", source: "analytics_block_a_validation" })];
  excludeTestEvents(rows);
  assert.equal(rows.length, 1, "o array original passado continua intacto");
});

// ---------------------------------------------------------------------------
// raw-events
// ---------------------------------------------------------------------------

test("selectRawAnalyticsEvents: respeita [start,end) e exclui teste por padrão", () => {
  const rows = [
    row({ id: "before", created_at: "2026-09-01T00:00:00.000Z" }),
    row({ id: "in-range", created_at: "2026-09-05T00:00:00.000Z", source: "qr" }),
    row({
      id: "test-in-range",
      created_at: "2026-09-05T00:00:00.000Z",
      source: "analytics_block_a_validation",
    }),
    row({ id: "at-end-excluded", created_at: "2026-09-08T00:00:00.000Z" }),
  ];

  const result = selectRawAnalyticsEvents(rows, {
    start: new Date("2026-09-01T00:00:00.000Z"),
    end: new Date("2026-09-08T00:00:00.000Z"),
  });

  assert.deepEqual(
    result.map((r) => r.id),
    ["before", "in-range"],
    "before entra (start inclusive), at-end-excluded fica de fora (end exclusivo), test-in-range é excluído por padrão",
  );
});

test("selectRawAnalyticsEvents: includeTestEvents:true traz eventos de teste de volta", () => {
  const rows = [
    row({
      id: "t1",
      created_at: "2026-09-05T00:00:00.000Z",
      source: "analytics_block_a_validation",
    }),
  ];
  const result = selectRawAnalyticsEvents(rows, {
    start: new Date("2026-09-01T00:00:00.000Z"),
    end: new Date("2026-09-08T00:00:00.000Z"),
    includeTestEvents: true,
  });
  assert.equal(result.length, 1);
});

test("selectRawAnalyticsEvents: só projeta os campos da allowlist (nenhum campo além dela, nenhuma PII)", () => {
  const rows = [row({ id: "r1", created_at: "2026-09-05T00:00:00.000Z" })];
  const [exported] = selectRawAnalyticsEvents(rows, {
    start: new Date("2026-09-01T00:00:00.000Z"),
    end: new Date("2026-09-08T00:00:00.000Z"),
  });

  const exportedKeys = Object.keys(exported).sort();
  const allowedKeys = [...RAW_EXPORT_FIELDS].sort();
  assert.deepEqual(exportedKeys, allowedKeys);

  const PII_KEYS = ["nome", "email", "telefone", "contato", "ip", "userAgent", "user_agent"];
  for (const key of PII_KEYS) {
    assert.equal(key in exported, false);
  }
});
