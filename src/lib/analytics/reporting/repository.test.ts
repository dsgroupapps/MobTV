import assert from "node:assert/strict";
import test from "node:test";

import {
  createInMemoryAnalyticsEventsRepository,
  createSupabaseAnalyticsEventsRepository,
} from "./repository.ts";
import { row } from "./fixtures.test-support.ts";

test("createInMemoryAnalyticsEventsRepository: respeita [start,end) sem tocar rede", async () => {
  const repo = createInMemoryAnalyticsEventsRepository([
    row({ id: "before", created_at: "2026-09-01T00:00:00.000Z" }),
    row({ id: "in-range", created_at: "2026-09-05T00:00:00.000Z" }),
    row({ id: "after", created_at: "2026-09-08T00:00:00.000Z" }),
  ]);

  const result = await repo.fetchEvents({
    start: new Date("2026-09-02T00:00:00.000Z"),
    end: new Date("2026-09-08T00:00:00.000Z"),
  });

  assert.deepEqual(
    result.map((r) => r.id),
    ["in-range"],
  );
});

/**
 * O client abaixo simula exatamente o que acontece HOJE contra o Supabase
 * LIVE com a publishable/anon key: a policy de RLS só permite INSERT, então
 * um SELECT retorna um erro de permissão do Postgrest. Isto NÃO toca rede —
 * é um objeto fake, no mesmo espírito do teste de `insertAnalyticsEvent` do
 * Bloco A (`src/lib/analytics/persistence.test.ts`).
 */
function fakeClientDeniedBySelectRls() {
  return {
    from() {
      return {
        select() {
          return this;
        },
        gte() {
          return this;
        },
        lt() {
          return Promise.resolve({
            data: null,
            error: { message: "permission denied for table analytics_events", code: "42501" },
          });
        },
      };
    },
    // biome-ignore lint: shape mínimo que createSupabaseAnalyticsEventsRepository usa
  } as never;
}

test("createSupabaseAnalyticsEventsRepository: propaga o erro de permissão como exceção clara (não finge sucesso)", async () => {
  const repo = createSupabaseAnalyticsEventsRepository(fakeClientDeniedBySelectRls());

  await assert.rejects(
    () => repo.fetchEvents({ start: new Date("2026-09-01"), end: new Date("2026-09-08") }),
    /permission denied|42501/,
  );
});

function fakeClientWithData(rows: ReturnType<typeof row>[]) {
  return {
    from() {
      return {
        select() {
          return this;
        },
        gte() {
          return this;
        },
        lt() {
          return Promise.resolve({ data: rows, error: null });
        },
      };
    },
    // biome-ignore lint: shape mínimo que createSupabaseAnalyticsEventsRepository usa
  } as never;
}

test("createSupabaseAnalyticsEventsRepository: com um client que retorna dados (mock), repassa as linhas — cobre o caminho feliz sem depender do Supabase LIVE", async () => {
  const repo = createSupabaseAnalyticsEventsRepository(fakeClientWithData([row({ id: "r1" })]));
  const result = await repo.fetchEvents({
    start: new Date("2026-09-01"),
    end: new Date("2026-09-08"),
  });
  assert.deepEqual(
    result.map((r) => r.id),
    ["r1"],
  );
});
