import "@tanstack/react-start/server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Client Supabase dedicado à escrita de `analytics_events`. Deliberadamente
 * SEM `@supabase/ssr`/cookies: gravar um evento não depende da sessão de
 * autenticação do visitante (a esmagadora maioria não tem uma), então não
 * há motivo para carregar o fluxo de cookies do `createServerSupabaseClient`
 * em `src/lib/supabase/server.ts`.
 *
 * Reaproveita exatamente as mesmas env vars que o resto do servidor já usa
 * (`SUPABASE_URL`/`VITE_SUPABASE_URL` e
 * `SUPABASE_PUBLISHABLE_KEY`/`VITE_SUPABASE_PUBLISHABLE_KEY`) — nenhuma
 * variável nova. É a mesma publishable/anon key, então esta conexão só
 * consegue fazer o que a policy de RLS de `analytics_events` permite: INSERT
 * (ver migration). Nunca usar service_role aqui.
 */
let analyticsClient: SupabaseClient<Database> | undefined;

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value =
      (typeof process !== "undefined" ? process.env[key] : undefined) ??
      (import.meta.env as Record<string, string | undefined>)[key];
    if (value) return value;
  }
  return undefined;
}

function getAnalyticsSupabaseConfig(): { url?: string; publishableKey?: string } {
  return {
    url: readEnv("SUPABASE_URL", "VITE_SUPABASE_URL"),
    publishableKey: readEnv("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"),
  };
}

/** Só para diagnóstico/testes — não lança, só informa se dá para conectar. */
export function hasAnalyticsSupabaseConfig(): boolean {
  const { url, publishableKey } = getAnalyticsSupabaseConfig();
  return Boolean(url && publishableKey);
}

/**
 * `undefined` quando Supabase não está configurado no ambiente (ex.
 * `vite dev` sem `.env.local`) — quem chama decide o fallback. Nunca lança:
 * analytics é best-effort, pois a falta de config não pode derrubar a rota.
 */
export function getAnalyticsSupabaseClient(): SupabaseClient<Database> | undefined {
  if (analyticsClient) return analyticsClient;

  const { url, publishableKey } = getAnalyticsSupabaseConfig();
  if (!url || !publishableKey) return undefined;

  analyticsClient = createClient<Database>(url, publishableKey, {
    auth: { persistSession: false },
  });
  return analyticsClient;
}
