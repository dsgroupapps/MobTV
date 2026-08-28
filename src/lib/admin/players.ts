import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDatabaseError, requireAdminArea } from "./shared";
import type { AdminPlayerPanel } from "./types";

export const getAdminPlayers = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminPlayerPanel[]> => {
    await requireAdminArea();
    const { data, error } = await createServerSupabaseClient()
      .from("panels")
      .select("id,name,region,address,active")
      .eq("active", true)
      .order("name");
    if (error) throw adminDatabaseError("Erro ao carregar os players", error);
    return data ?? [];
  },
);

export function adminPlayersQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["admin-players", userId] as const,
    queryFn: () => getAdminPlayers(),
    staleTime: 30_000,
  });
}
