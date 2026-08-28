import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDatabaseError, requireAdminArea } from "./shared";
import type { AdminModerationData } from "./types";

const moderationSchema = z.object({
  assetId: z.string().uuid(),
  action: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(1_000).optional(),
});

export const getAdminModeration = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminModerationData> => {
    await requireAdminArea();
    const supabase = createServerSupabaseClient();
    const [assetsResult, logsResult] = await Promise.all([
      supabase
        .from("assets")
        .select(
          "id,order_item_id,user_id,type,width,height,duration_seconds,storage_url,created_at",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("moderation_logs")
        .select("id,asset_id,reviewer_id,action,reason,created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const firstError = assetsResult.error ?? logsResult.error;
    if (firstError) throw adminDatabaseError("Erro ao carregar a fila de moderação", firstError);

    const assets = assetsResult.data ?? [];
    const logs = logsResult.data ?? [];
    const orderItemIds = assets
      .map((asset) => asset.order_item_id)
      .filter((id): id is string => Boolean(id));
    const userIds = new Set([
      ...assets.map((asset) => asset.user_id),
      ...logs.map((log) => log.reviewer_id),
    ]);

    const [itemsResult, profilesResult] = await Promise.all([
      orderItemIds.length > 0
        ? supabase.from("order_items").select("id,panel_id").in("id", orderItemIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.size > 0
        ? supabase
            .from("profiles")
            .select("id,name")
            .in("id", [...userIds])
        : Promise.resolve({ data: [], error: null }),
    ]);

    const relationError = itemsResult.error ?? profilesResult.error;
    if (relationError)
      throw adminDatabaseError("Erro ao relacionar os dados de moderação", relationError);

    const panelIds = (itemsResult.data ?? []).map((item) => item.panel_id);
    const panelsResult = panelIds.length
      ? await supabase.from("panels").select("id,name,region").in("id", panelIds)
      : { data: [], error: null };
    if (panelsResult.error)
      throw adminDatabaseError("Erro ao carregar os painéis da moderação", panelsResult.error);

    const profiles = new Map(
      (profilesResult.data ?? []).map((profile) => [profile.id, profile.name]),
    );
    const items = new Map((itemsResult.data ?? []).map((item) => [item.id, item.panel_id]));
    const panels = new Map((panelsResult.data ?? []).map((panel) => [panel.id, panel]));

    return {
      pendingAssets: assets.map((asset) => {
        const panel = asset.order_item_id ? panels.get(items.get(asset.order_item_id) ?? "") : null;
        return {
          id: asset.id,
          orderItemId: asset.order_item_id,
          advertiserName: profiles.get(asset.user_id) ?? "Anunciante não identificado",
          panelName: panel?.name ?? "Painel não identificado",
          panelRegion: panel?.region ?? "Região não informada",
          type: asset.type,
          width: asset.width,
          height: asset.height,
          durationSeconds: asset.duration_seconds,
          storagePath: asset.storage_url,
          createdAt: asset.created_at,
        };
      }),
      recentLogs: logs.map((log) => ({
        id: log.id,
        assetId: log.asset_id,
        reviewerName: profiles.get(log.reviewer_id) ?? "Revisor não identificado",
        action: log.action,
        reason: log.reason,
        createdAt: log.created_at,
      })),
    };
  },
);

export function adminModerationQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["admin-moderation", userId] as const,
    queryFn: () => getAdminModeration(),
    staleTime: 15_000,
  });
}

export const moderateAdminAsset = createServerFn({ method: "POST" })
  .validator(moderationSchema)
  .handler(async ({ data }) => {
    const reviewer = await requireAdminArea();
    const supabase = createServerSupabaseClient();
    const { data: updated, error: updateError } = await supabase
      .from("assets")
      .update({ status: data.action })
      .eq("id", data.assetId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError) throw adminDatabaseError("Erro ao atualizar a mídia", updateError);
    if (!updated) throw new Error("A mídia não está mais pendente ou não pode ser moderada.");

    const { error: logError } = await supabase.from("moderation_logs").insert({
      asset_id: data.assetId,
      reviewer_id: reviewer.id,
      action: data.action,
      reason: data.reason?.trim() || null,
    });
    if (logError)
      throw adminDatabaseError("Mídia atualizada, mas o histórico não foi registrado", logError);

    return { success: true } as const;
  });
