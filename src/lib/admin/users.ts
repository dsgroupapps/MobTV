import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { isAppRole } from "@/lib/auth/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDatabaseError, requireAdminMutation } from "./shared";
import type { AdminUsersData } from "./types";

export const getAdminUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminUsersData> => {
    await requireAdminMutation();
    const supabase = createServerSupabaseClient();
    const [profilesResult, rolesResult, assetsResult, ordersResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,name,created_at")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("assets").select("user_id,status,created_at"),
      supabase
        .from("orders")
        .select("id,user_id,status,created_at")
        .order("created_at", { ascending: false }),
    ]);

    const firstError =
      profilesResult.error ?? rolesResult.error ?? assetsResult.error ?? ordersResult.error;
    if (firstError) throw adminDatabaseError("Erro ao carregar usuários", firstError);

    const profiles = profilesResult.data ?? [];
    const roles = rolesResult.data ?? [];
    const assets = assetsResult.data ?? [];
    const orders = ordersResult.data ?? [];
    const roleByUser = new Map(
      roles
        .filter((entry) => isAppRole(entry.role))
        .map((entry) => [entry.user_id, entry.role] as const),
    );
    const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1_000;

    return {
      users: profiles.map((profile) => {
        const userAssets = assets.filter((asset) => asset.user_id === profile.id);
        return {
          id: profile.id,
          name: profile.name,
          role: roleByUser.get(profile.id) ?? "advertiser",
          createdAt: profile.created_at,
          approvedAssets: userAssets.filter((asset) => asset.status === "approved").length,
          pendingAssets: userAssets.filter((asset) => asset.status === "pending").length,
          recentOrders: orders
            .filter((order) => order.user_id === profile.id)
            .slice(0, 3)
            .map((order) => ({
              id: order.id,
              status: order.status,
              createdAt: order.created_at,
            })),
        };
      }),
      stats: {
        totalUsers: profiles.length,
        recentCampaigns: orders.filter(
          (order) => new Date(order.created_at).getTime() >= last30Days,
        ).length,
        pendingAssets: assets.filter((asset) => asset.status === "pending").length,
        approvedAssets: assets.filter((asset) => asset.status === "approved").length,
      },
    };
  },
);

export function adminUsersQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["admin-users", userId] as const,
    queryFn: () => getAdminUsers(),
    staleTime: 30_000,
  });
}
