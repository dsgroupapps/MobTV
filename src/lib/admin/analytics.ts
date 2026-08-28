import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDatabaseError, requireAdminArea } from "./shared";
import type { AdminAnalyticsClient, AdminAnalyticsData } from "./types";

const RECENT_OPP_LIMIT = 100;

export const getAdminAnalytics = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminAnalyticsData> => {
    await requireAdminArea();
    const supabase = createServerSupabaseClient();
    const [ordersResult, itemsResult, logsResult, exhibitionsResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id,user_id,status,total_amount,created_at")
        .order("created_at", { ascending: false }),
      supabase.from("order_items").select("id,order_id,panel_id"),
      supabase
        .from("opp_logs")
        .select("id,asset_id,panel_id,played_at,duration_seconds,status")
        .order("played_at", { ascending: false })
        .limit(RECENT_OPP_LIMIT),
      supabase
        .from("opp_logs")
        .select("id", { count: "exact", head: true })
        .eq("status", "success"),
    ]);
    const firstError =
      ordersResult.error ?? itemsResult.error ?? logsResult.error ?? exhibitionsResult.error;
    if (firstError) throw adminDatabaseError("Erro ao carregar analytics", firstError);

    const orders = ordersResult.data ?? [];
    const items = itemsResult.data ?? [];
    const logs = logsResult.data ?? [];
    const assetIds = [...new Set(logs.map((log) => log.asset_id))];
    const assetsResult = assetIds.length
      ? await supabase.from("assets").select("id,user_id").in("id", assetIds)
      : { data: [], error: null };
    if (assetsResult.error)
      throw adminDatabaseError("Erro ao relacionar as mídias dos analytics", assetsResult.error);

    const userIds = new Set([
      ...orders.map((order) => order.user_id),
      ...(assetsResult.data ?? []).map((asset) => asset.user_id),
    ]);
    const panelIds = [...new Set(logs.map((log) => log.panel_id))];
    const [profilesResult, panelsResult] = await Promise.all([
      userIds.size
        ? supabase
            .from("profiles")
            .select("id,name")
            .in("id", [...userIds])
        : Promise.resolve({ data: [], error: null }),
      panelIds.length
        ? supabase.from("panels").select("id,name,region").in("id", panelIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    const relationError = profilesResult.error ?? panelsResult.error;
    if (relationError)
      throw adminDatabaseError("Erro ao relacionar os dados dos analytics", relationError);

    const profiles = new Map(
      (profilesResult.data ?? []).map((profile) => [profile.id, profile.name]),
    );
    const panels = new Map((panelsResult.data ?? []).map((panel) => [panel.id, panel]));
    const assetOwners = new Map(
      (assetsResult.data ?? []).map((asset) => [asset.id, asset.user_id]),
    );
    const itemCounts = new Map<string, number>();
    for (const item of items)
      itemCounts.set(item.order_id, (itemCounts.get(item.order_id) ?? 0) + 1);

    const clientAccumulator = new Map<
      string,
      { userName: string; exhibitions: number; panelIds: Set<string> }
    >();
    for (const log of logs) {
      const userId = assetOwners.get(log.asset_id) ?? "unknown";
      const current = clientAccumulator.get(userId) ?? {
        userName: profiles.get(userId) ?? "Anunciante não identificado",
        exhibitions: 0,
        panelIds: new Set<string>(),
      };
      current.exhibitions += 1;
      current.panelIds.add(log.panel_id);
      clientAccumulator.set(userId, current);
    }

    const clients: AdminAnalyticsClient[] = [...clientAccumulator.entries()]
      .map(([userId, client]) => ({
        userId,
        userName: client.userName,
        exhibitions: client.exhibitions,
        panelCount: client.panelIds.size,
      }))
      .sort((a, b) => b.exhibitions - a.exhibitions);
    const paidOrders = orders.filter((order) => order.status === "paid");

    return {
      metrics: {
        totalRevenue: orders.reduce((sum, order) => sum + Number(order.total_amount), 0),
        paidOrders: paidOrders.length,
        totalExhibitions: exhibitionsResult.count ?? 0,
        uniqueAdvertisers: new Set(orders.map((order) => order.user_id)).size,
      },
      orders: orders.map((order) => ({
        id: order.id,
        userName: profiles.get(order.user_id) ?? "Anunciante não identificado",
        createdAt: order.created_at,
        itemCount: itemCounts.get(order.id) ?? 0,
        status: order.status,
        totalAmount: Number(order.total_amount),
      })),
      clients,
      recentOppLogs: logs.map((log) => {
        const panel = panels.get(log.panel_id);
        const userId = assetOwners.get(log.asset_id);
        return {
          id: log.id,
          advertiserName: userId
            ? (profiles.get(userId) ?? "Anunciante não identificado")
            : "Anunciante não identificado",
          panelName: panel?.name ?? "Painel não identificado",
          panelRegion: panel?.region ?? "Região não informada",
          playedAt: log.played_at,
          durationSeconds: log.duration_seconds,
          status: log.status,
        };
      }),
      recentLogLimit: RECENT_OPP_LIMIT,
    };
  },
);

export function adminAnalyticsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["admin-analytics", userId] as const,
    queryFn: () => getAdminAnalytics(),
    staleTime: 30_000,
  });
}
