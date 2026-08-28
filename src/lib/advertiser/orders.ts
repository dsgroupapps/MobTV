import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { advertiserDatabaseError, requireAdvertiser } from "./shared";
import type {
  AdvertiserAsset,
  AdvertiserOrder,
  AdvertiserOrderDetail,
  AdvertiserOrderItem,
} from "./types";

const orderIdSchema = z.object({ orderId: z.string().uuid() });

type RawOrderItem = {
  id: string;
  panel_id: string;
  date: string;
  start_time: string;
  duration_seconds: number;
  unit_price: number;
  final_price: number;
  panels: { id: string; name: string; region: string; address: string } | null;
};

function mapOrderItem(item: RawOrderItem, assets: AdvertiserAsset[] = []): AdvertiserOrderItem {
  return {
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
    assets,
  };
}

export const getAdvertiserOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdvertiserOrder[]> => {
    const user = await requireAdvertiser();
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id,quote_id,status,total_amount,paid_at,created_at,order_items(id,panel_id,date,start_time,duration_seconds,unit_price,final_price,panels(id,name,region,address))",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw advertiserDatabaseError("Erro ao carregar pedidos", error);

    return (data ?? []).map((order) => {
      const items = (order.order_items ?? []).map((item) => mapOrderItem(item as RawOrderItem));
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
  },
);

export function advertiserOrdersQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["advertiser-orders", userId] as const,
    queryFn: () => getAdvertiserOrders(),
    staleTime: 30_000,
  });
}

export const getAdvertiserOrderDetail = createServerFn({ method: "GET" })
  .validator(orderIdSchema)
  .handler(async ({ data }): Promise<AdvertiserOrderDetail | null> => {
    const user = await requireAdvertiser();
    const supabase = createServerSupabaseClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id,quote_id,status,total_amount,paid_at,created_at,quotes(id,type,date_start,date_end,duration_seconds,total_insertions,status,total_price),order_items(id,panel_id,date,start_time,duration_seconds,unit_price,final_price,panels(id,name,region,address))",
      )
      .eq("id", data.orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw advertiserDatabaseError("Erro ao carregar o pedido", error);
    if (!order) return null;

    const rawItems = (order.order_items ?? []) as RawOrderItem[];
    const itemIds = rawItems.map((item) => item.id);
    let assets: AdvertiserAsset[] = [];

    if (itemIds.length > 0) {
      const { data: rawAssets, error: assetsError } = await supabase
        .from("assets")
        .select(
          "id,order_item_id,status,type,width,height,duration_seconds,storage_url,created_at,delete_at",
        )
        .eq("user_id", user.id)
        .in("order_item_id", itemIds)
        .order("created_at", { ascending: false });

      if (assetsError)
        throw advertiserDatabaseError("Erro ao carregar mídias do pedido", assetsError);

      const itemById = new Map(rawItems.map((item) => [item.id, item]));
      assets = (rawAssets ?? []).map((asset) => {
        const item = asset.order_item_id ? itemById.get(asset.order_item_id) : undefined;
        return {
          id: asset.id,
          orderItemId: asset.order_item_id,
          status: asset.status,
          type: asset.type,
          width: asset.width,
          height: asset.height,
          durationSeconds: asset.duration_seconds,
          storagePath: asset.storage_url,
          createdAt: asset.created_at,
          deleteAt: asset.delete_at,
          panel: item?.panels
            ? {
                id: item.panels.id,
                name: item.panels.name,
                region: item.panels.region,
                address: item.panels.address,
              }
            : null,
          date: item?.date ?? null,
          startTime: item?.start_time ?? null,
        };
      });
    }

    const assetIds = assets.map((asset) => asset.id);
    const byAsset: Record<string, number> = {};
    let totalDurationSeconds = 0;

    if (assetIds.length > 0) {
      const { data: logs, error: logsError } = await supabase
        .from("opp_logs")
        .select("asset_id,duration_seconds")
        .in("asset_id", assetIds)
        .eq("status", "success");

      if (logsError) throw advertiserDatabaseError("Erro ao carregar exibições", logsError);
      for (const log of logs ?? []) {
        byAsset[log.asset_id] = (byAsset[log.asset_id] ?? 0) + 1;
        totalDurationSeconds += log.duration_seconds ?? 0;
      }
    }

    const items = rawItems.map((item) =>
      mapOrderItem(
        item,
        assets.filter((asset) => asset.orderItemId === item.id),
      ),
    );
    const quote = Array.isArray(order.quotes) ? order.quotes[0] : order.quotes;

    return {
      id: order.id,
      quoteId: order.quote_id,
      status: order.status,
      totalAmount: Number(order.total_amount),
      paidAt: order.paid_at,
      createdAt: order.created_at,
      itemCount: items.length,
      items,
      quote: quote
        ? {
            id: quote.id,
            type: quote.type,
            dateStart: quote.date_start,
            dateEnd: quote.date_end,
            durationSeconds: quote.duration_seconds,
            totalInsertions: quote.total_insertions,
            status: quote.status,
            totalPrice: Number(quote.total_price),
          }
        : null,
      exhibitions: {
        total: Object.values(byAsset).reduce((total, count) => total + count, 0),
        totalDurationSeconds,
        byAsset,
      },
    };
  });

export function advertiserOrderDetailQueryOptions(userId: string, orderId: string) {
  return queryOptions({
    queryKey: ["advertiser-order", userId, orderId] as const,
    queryFn: () => getAdvertiserOrderDetail({ data: { orderId } }),
    staleTime: 15_000,
  });
}
