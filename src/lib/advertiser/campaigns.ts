import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { advertiserDatabaseError, requireAdvertiser } from "./shared";
import type {
  AdvertiserCampaignsData,
  AdvertiserExhibition,
  AdvertiserOrder,
  AdvertiserOrderItem,
} from "./types";

export const getAdvertiserCampaigns = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdvertiserCampaignsData> => {
    const user = await requireAdvertiser();
    const supabase = createServerSupabaseClient();
    const { data: rawOrders, error: ordersError } = await supabase
      .from("orders")
      .select(
        "id,quote_id,status,total_amount,paid_at,created_at,order_items(id,panel_id,date,start_time,duration_seconds,unit_price,final_price,panels(id,name,region,address))",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ordersError) throw advertiserDatabaseError("Erro ao carregar campanhas", ordersError);

    const orders: AdvertiserOrder[] = (rawOrders ?? []).map((order) => {
      const items: AdvertiserOrderItem[] = (order.order_items ?? []).map((item) => ({
        id: item.id,
        panelId: item.panel_id,
        panel: item.panels
          ? {
              id: item.panels.id,
              name: item.panels.name,
              region: item.panels.region,
              address: item.panels.address,
            }
          : null,
        date: item.date,
        startTime: item.start_time,
        durationSeconds: item.duration_seconds,
        unitPrice: Number(item.unit_price),
        finalPrice: Number(item.final_price),
        assets: [],
      }));
      return {
        id: order.id,
        quoteId: order.quote_id,
        status: order.status,
        totalAmount: Number(order.total_amount),
        paidAt: order.paid_at,
        createdAt: order.created_at,
        itemCount: items.length,
        items,
      };
    });

    const orderItemIds = orders.flatMap((order) => order.items.map((item) => item.id));
    if (orderItemIds.length === 0) return { orders, exhibitions: [] };

    const { data: rawAssets, error: assetsError } = await supabase
      .from("assets")
      .select("id,order_item_id")
      .eq("user_id", user.id)
      .in("order_item_id", orderItemIds);

    if (assetsError) throw advertiserDatabaseError("Erro ao carregar exibições", assetsError);

    const assetIds = (rawAssets ?? []).map((asset) => asset.id);
    let exhibitions: AdvertiserExhibition[] = [];

    if (assetIds.length > 0) {
      const { data: logs, error: logsError } = await supabase
        .from("opp_logs")
        .select("id,asset_id,played_at,duration_seconds")
        .in("asset_id", assetIds)
        .eq("status", "success")
        .order("played_at", { ascending: false })
        .limit(100);

      if (logsError) throw advertiserDatabaseError("Erro ao carregar exibições", logsError);

      const orderItemById = new Map(
        orders.flatMap((order) => order.items.map((item) => [item.id, item] as const)),
      );
      const assetItemById = new Map(
        (rawAssets ?? []).map((asset) => [asset.id, asset.order_item_id] as const),
      );
      exhibitions = (logs ?? []).map((log) => {
        const itemId = assetItemById.get(log.asset_id);
        const item = itemId ? orderItemById.get(itemId) : undefined;
        return {
          id: log.id,
          assetId: log.asset_id,
          panelName: item?.panel?.name ?? "Painel desconhecido",
          playedAt: log.played_at,
          durationSeconds: log.duration_seconds,
        };
      });
    }

    return { orders, exhibitions };
  },
);

export function advertiserCampaignsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["advertiser-campaigns", userId] as const,
    queryFn: () => getAdvertiserCampaigns(),
    staleTime: 30_000,
  });
}
