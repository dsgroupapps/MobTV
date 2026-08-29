import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeAssetStoragePath } from "@/lib/supabase/storage";
import { adminDatabaseError, requireAdminMutation } from "./shared";
import type { AdminFillerData } from "./types";

const fillerIdSchema = z.object({ id: z.string().uuid() });
const panelIdsSchema = z.array(z.string().uuid()).max(500);
const signedUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z
    .string()
    .trim()
    .refine((value) => value.startsWith("image/") || value.startsWith("video/"), {
      message: "Envie uma imagem ou um vídeo.",
    }),
  size: z
    .number()
    .int()
    .positive()
    .max(100 * 1024 * 1024, "O arquivo deve ter até 100 MB."),
});
const createFillerSchema = z.object({
  name: z.string().trim().min(1).max(180),
  type: z.string().trim().min(1).max(120),
  width: z.number().int().positive().max(20_000),
  height: z.number().int().positive().max(20_000),
  durationSeconds: z.number().int().positive().max(3_600),
  storagePath: z.string().trim().startsWith("filler/").max(500),
  panelIds: panelIdsSchema,
});
const updatePanelsSchema = fillerIdSchema.extend({ panelIds: panelIdsSchema });
const toggleFillerSchema = fillerIdSchema.extend({ active: z.boolean() });
const cleanupUploadSchema = z.object({
  storagePath: z.string().trim().startsWith("filler/").max(500),
});

async function assertPanelsExist(panelIds: string[]) {
  if (panelIds.length === 0) return;
  const { data, error } = await createServerSupabaseClient()
    .from("panels")
    .select("id")
    .in("id", panelIds)
    .eq("active", true);
  if (error) throw adminDatabaseError("Erro ao validar os painéis", error);
  if ((data ?? []).length !== new Set(panelIds).size) {
    throw new Error("Um ou mais painéis selecionados não estão ativos.");
  }
}

export const getAdminFillerMedia = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminFillerData> => {
    await requireAdminMutation();
    const supabase = createServerSupabaseClient();
    const [mediaResult, panelsResult] = await Promise.all([
      supabase
        .from("filler_media")
        .select(
          "id,name,type,width,height,duration_seconds,storage_url,panel_ids,active,created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("panels").select("id,name").eq("active", true).order("name"),
    ]);
    const firstError = mediaResult.error ?? panelsResult.error;
    if (firstError) throw adminDatabaseError("Erro ao carregar mídias filler", firstError);
    return {
      media: (mediaResult.data ?? []).map((media) => ({
        id: media.id,
        name: media.name,
        type: media.type,
        width: media.width,
        height: media.height,
        durationSeconds: media.duration_seconds,
        storagePath: media.storage_url,
        panelIds: media.panel_ids ?? [],
        active: media.active,
        createdAt: media.created_at,
      })),
      panels: panelsResult.data ?? [],
    };
  },
);

export function adminFillerQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["admin-filler", userId] as const,
    queryFn: () => getAdminFillerMedia(),
    staleTime: 30_000,
  });
}

export const createAdminFillerUploadUrl = createServerFn({ method: "POST" })
  .validator(signedUploadSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const rawExtension = data.fileName.split(".").pop()?.toLowerCase() ?? "bin";
    const extension = /^[a-z0-9]{1,10}$/.test(rawExtension) ? rawExtension : "bin";
    const path = `filler/${crypto.randomUUID()}.${extension}`;
    const { data: signed, error } = await createServerSupabaseClient()
      .storage.from("assets")
      .createSignedUploadUrl(path);
    if (error) throw adminDatabaseError("Erro ao preparar o upload da mídia filler", error);
    return { path: signed.path, token: signed.token };
  });

export const createAdminFillerMedia = createServerFn({ method: "POST" })
  .validator(createFillerSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    await assertPanelsExist(data.panelIds);
    const { error } = await createServerSupabaseClient()
      .from("filler_media")
      .insert({
        name: data.name,
        type: data.type,
        width: data.width,
        height: data.height,
        duration_seconds: data.durationSeconds,
        storage_url: data.storagePath,
        panel_ids: [...new Set(data.panelIds)],
      });
    if (error) throw adminDatabaseError("Erro ao criar a mídia filler", error);
    return { success: true } as const;
  });

export const updateAdminFillerPanels = createServerFn({ method: "POST" })
  .validator(updatePanelsSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    await assertPanelsExist(data.panelIds);
    const { error } = await createServerSupabaseClient()
      .from("filler_media")
      .update({ panel_ids: [...new Set(data.panelIds)] })
      .eq("id", data.id);
    if (error) throw adminDatabaseError("Erro ao atualizar os painéis da mídia filler", error);
    return { success: true } as const;
  });

export const toggleAdminFillerMedia = createServerFn({ method: "POST" })
  .validator(toggleFillerSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const { error } = await createServerSupabaseClient()
      .from("filler_media")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw adminDatabaseError("Erro ao atualizar o status da mídia filler", error);
    return { success: true } as const;
  });

export const cleanupAdminFillerUpload = createServerFn({ method: "POST" })
  .validator(cleanupUploadSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const { error } = await createServerSupabaseClient()
      .storage.from("assets")
      .remove([data.storagePath]);
    if (error) throw adminDatabaseError("Erro ao limpar o upload incompleto", error);
    return { success: true } as const;
  });

export const deleteAdminFillerMedia = createServerFn({ method: "POST" })
  .validator(fillerIdSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const supabase = createServerSupabaseClient();
    const { data: media, error: readError } = await supabase
      .from("filler_media")
      .select("storage_url")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw adminDatabaseError("Erro ao localizar a mídia filler", readError);
    if (!media) throw new Error("Mídia filler não encontrada.");

    const { error: deleteError } = await supabase.from("filler_media").delete().eq("id", data.id);
    if (deleteError) throw adminDatabaseError("Erro ao excluir a mídia filler", deleteError);

    const { error: storageError } = await supabase.storage
      .from("assets")
      .remove([normalizeAssetStoragePath(media.storage_url)]);
    return { success: true, storageRemoved: !storageError } as const;
  });
