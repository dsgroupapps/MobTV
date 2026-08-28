import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { advertiserDatabaseError, requireAdvertiser } from "./shared";
import type { AdvertiserAsset } from "./types";

export const getAdvertiserAssets = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdvertiserAsset[]> => {
    const user = await requireAdvertiser();
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("assets")
      .select(
        "id,order_item_id,status,type,width,height,duration_seconds,storage_url,created_at,delete_at,order_items(panel_id,date,start_time,panels(id,name,region,address))",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw advertiserDatabaseError("Erro ao carregar mídias", error);

    return (data ?? []).map((asset) => {
      const orderItem = Array.isArray(asset.order_items) ? asset.order_items[0] : asset.order_items;
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
        panel: orderItem?.panels
          ? {
              id: orderItem.panels.id,
              name: orderItem.panels.name,
              region: orderItem.panels.region,
              address: orderItem.panels.address,
            }
          : null,
        date: orderItem?.date ?? null,
        startTime: orderItem?.start_time ?? null,
      };
    });
  },
);

export function advertiserAssetsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["advertiser-assets", userId] as const,
    queryFn: () => getAdvertiserAssets(),
    staleTime: 30_000,
  });
}
