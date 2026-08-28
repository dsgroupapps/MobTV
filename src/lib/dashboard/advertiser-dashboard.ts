import { queryOptions } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { requireCurrentRole } from "@/lib/auth/session.server";
import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type AssetStatus = Database["public"]["Enums"]["asset_status"];

export type DashboardOrder = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
};

export type DashboardAsset = {
  id: string;
  status: AssetStatus;
  type: string;
  width: number;
  height: number;
  createdAt: string;
};

export type AdvertiserDashboardData = {
  metrics: {
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    totalInvestment: number;
    totalAssets: number;
    approvedAssets: number;
    pendingAssets: number;
    totalExhibitions: number;
  };
  recentOrders: DashboardOrder[];
  recentAssets: DashboardAsset[];
};

export const getAdvertiserDashboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdvertiserDashboardData> => {
    const user = await requireCurrentRole(["advertiser"]);
    if (user.role !== "advertiser") throw redirect({ href: "/admin" });

    const supabase = createServerSupabaseClient();

    const [ordersResult, assetsResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id,status,total_amount,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("assets")
        .select("id,status,type,width,height,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (ordersResult.error || assetsResult.error) {
      console.error("Failed to load advertiser dashboard", {
        orders: ordersResult.error,
        assets: assetsResult.error,
      });
      throw new Error("Não foi possível carregar os dados do painel agora.");
    }

    const orders = ordersResult.data ?? [];
    const assets = assetsResult.data ?? [];
    let totalExhibitions = 0;

    if (assets.length > 0) {
      const { count, error } = await supabase
        .from("opp_logs")
        .select("id", { count: "exact", head: true })
        .in(
          "asset_id",
          assets.map((asset) => asset.id),
        )
        .eq("status", "success");

      if (error) {
        console.error("Failed to load advertiser exhibition count", error);
        throw new Error("Não foi possível carregar os dados do painel agora.");
      }

      totalExhibitions = count ?? 0;
    }

    const confirmedOrders = orders.filter(
      (order) => order.status === "paid" || order.status === "released",
    );

    return {
      metrics: {
        totalOrders: orders.length,
        pendingOrders: orders.filter((order) => order.status === "pending").length,
        confirmedOrders: confirmedOrders.length,
        totalInvestment: confirmedOrders.reduce(
          (total, order) => total + Number(order.total_amount),
          0,
        ),
        totalAssets: assets.length,
        approvedAssets: assets.filter((asset) => asset.status === "approved").length,
        pendingAssets: assets.filter((asset) => asset.status === "pending").length,
        totalExhibitions,
      },
      recentOrders: orders.slice(0, 5).map((order) => ({
        id: order.id,
        status: order.status,
        totalAmount: Number(order.total_amount),
        createdAt: order.created_at,
      })),
      recentAssets: assets.slice(0, 5).map((asset) => ({
        id: asset.id,
        status: asset.status,
        type: asset.type,
        width: asset.width,
        height: asset.height,
        createdAt: asset.created_at,
      })),
    };
  },
);

export function advertiserDashboardQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["advertiser-dashboard", userId] as const,
    queryFn: () => getAdvertiserDashboard(),
    staleTime: 30_000,
  });
}
