import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  CAMPAIGN_PANEL_DAILY_PRICE,
  QUOTE_TTL_MINUTES,
  calculateCampaignTotal,
  calculateSpaceSlotPrice,
  campaignBriefSchema,
  generateLegacyTimeSlots,
  selectedTimeSlotsSchema,
  type CampaignPricingRule,
} from "@/lib/campaign/business";
import { mapCampaignPanel } from "@/lib/campaign/functions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDatabaseError, requireAdminArea, requireAdminMutation } from "./shared";
import type {
  AdminCampaignCreationData,
  AdminCampaignFilters,
  AdminReservation,
  AdminTargetUserStats,
} from "./types";

const reservationInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  panelId: z.string().uuid().nullable(),
  userId: z.string().uuid().nullable(),
});
const rescheduleSchema = z.object({
  orderItemId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}:00$/),
});
const targetUserSchema = z.object({ userId: z.string().uuid() });
const createAdminCampaignSchema = z
  .object({
    targetUserId: z.string().uuid(),
    quoteData: campaignBriefSchema,
    panelIds: z.array(z.string().uuid()),
    slots: selectedTimeSlotsSchema,
  })
  .superRefine((value, context) => {
    if (value.quoteData.type === "campaign" && value.panelIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["panelIds"],
        message: "Selecione um painel.",
      });
    }
    if (value.quoteData.type === "space" && value.slots.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slots"],
        message: "Selecione um horário.",
      });
    }
  });

const panelSelect =
  "id,name,region,address,active,timezone,panel_formats(id,width,height,orientation,durations_allowed),pricing_rules(id,panel_id,duration_seconds,base_price,discount_pct,date_start,date_end,time_start,time_end,weekday)";

export const getAdminCampaignFilters = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminCampaignFilters> => {
    await requireAdminArea();
    const supabase = createServerSupabaseClient();
    const [usersResult, panelsResult] = await Promise.all([
      supabase.from("profiles").select("id,name").order("name"),
      supabase.from("panels").select("id,name,region").eq("active", true).order("name"),
    ]);
    const firstError = usersResult.error ?? panelsResult.error;
    if (firstError) throw adminDatabaseError("Erro ao carregar filtros de campanhas", firstError);
    return { users: usersResult.data ?? [], panels: panelsResult.data ?? [] };
  },
);

export function adminCampaignFiltersQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["admin-campaign-filters", userId] as const,
    queryFn: () => getAdminCampaignFilters(),
    staleTime: 60_000,
  });
}

export const getAdminReservations = createServerFn({ method: "GET" })
  .validator(reservationInputSchema)
  .handler(async ({ data }): Promise<AdminReservation[]> => {
    await requireAdminArea();
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("order_items")
      .select(
        "id,panel_id,date,start_time,duration_seconds,panels(id,name),orders!inner(id,user_id,status)",
      )
      .eq("date", data.date)
      .eq("orders.status", "paid");
    if (data.panelId) query = query.eq("panel_id", data.panelId);
    if (data.userId) query = query.eq("orders.user_id", data.userId);
    const { data: items, error } = await query;
    if (error) throw adminDatabaseError("Erro ao carregar reservas administrativas", error);

    const userIds = [...new Set((items ?? []).map((item) => item.orders.user_id))];
    const { data: profiles, error: profilesError } = userIds.length
      ? await supabase.from("profiles").select("id,name").in("id", userIds)
      : { data: [], error: null };
    if (profilesError) throw adminDatabaseError("Erro ao carregar anunciantes", profilesError);
    const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.name]));

    return (items ?? []).map((item) => ({
      id: item.id,
      panelId: item.panel_id,
      panelName: item.panels?.name ?? "Painel desconhecido",
      orderId: item.orders.id,
      userId: item.orders.user_id,
      userName: names.get(item.orders.user_id) ?? `Usuário ${item.orders.user_id.slice(0, 8)}`,
      date: item.date,
      startTime: item.start_time,
      durationSeconds: item.duration_seconds,
    }));
  });

export function adminReservationsQueryOptions(
  userId: string,
  date: string,
  panelId: string | null,
  targetUserId: string | null,
) {
  return queryOptions({
    queryKey: ["admin-reservations", userId, date, panelId, targetUserId] as const,
    queryFn: () => getAdminReservations({ data: { date, panelId, userId: targetUserId } }),
    staleTime: 10_000,
  });
}

export const adminRescheduleOrderItem = createServerFn({ method: "POST" })
  .validator(rescheduleSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.rpc("admin_reschedule_order_item", {
      p_order_item_id: data.orderItemId,
      p_date: data.date,
      p_start_time: data.startTime,
    });
    if (error) throw adminDatabaseError("Erro ao remarcar reserva", error);
    return { success: true } as const;
  });

export const getAdminCampaignCreationData = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminCampaignCreationData> => {
    await requireAdminMutation();
    const supabase = createServerSupabaseClient();
    const [usersResult, panelsResult] = await Promise.all([
      supabase.from("profiles").select("id,name").order("name"),
      supabase.from("panels").select(panelSelect).eq("active", true).order("name"),
    ]);
    const firstError = usersResult.error ?? panelsResult.error;
    if (firstError) throw adminDatabaseError("Erro ao carregar criação de campanha", firstError);
    return {
      users: usersResult.data ?? [],
      panels: (panelsResult.data ?? []).map(mapCampaignPanel),
    };
  },
);

export function adminCampaignCreationQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["admin-campaign-creation", userId] as const,
    queryFn: () => getAdminCampaignCreationData(),
    staleTime: 60_000,
  });
}

export const getAdminTargetUserStats = createServerFn({ method: "GET" })
  .validator(targetUserSchema)
  .handler(async ({ data }): Promise<AdminTargetUserStats> => {
    await requireAdminMutation();
    const supabase = createServerSupabaseClient();
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id,order_items(id,panels(name))")
      .eq("user_id", data.userId);
    if (error) throw adminDatabaseError("Erro ao carregar histórico do usuário", error);
    const panelCounts = new Map<string, number>();
    let totalInsertions = 0;
    for (const order of orders ?? []) {
      for (const item of order.order_items ?? []) {
        totalInsertions += 1;
        const panelName = item.panels?.name ?? "Desconhecido";
        panelCounts.set(panelName, (panelCounts.get(panelName) ?? 0) + 1);
      }
    }
    return {
      totalCampaigns: orders?.length ?? 0,
      totalInsertions,
      panelStats: [...panelCounts.entries()].map(([panelName, count]) => ({ panelName, count })),
    };
  });

export function adminTargetUserStatsQueryOptions(adminUserId: string, targetUserId: string) {
  return queryOptions({
    queryKey: ["admin-target-user-stats", adminUserId, targetUserId] as const,
    queryFn: () => getAdminTargetUserStats({ data: { userId: targetUserId } }),
    enabled: targetUserId.length > 0,
    staleTime: 30_000,
  });
}

export const createAdminCampaign = createServerFn({ method: "POST" })
  .validator(createAdminCampaignSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const supabase = createServerSupabaseClient();
    const allowedTimes = new Set(generateLegacyTimeSlots());
    const panelIds =
      data.quoteData.type === "campaign"
        ? [...new Set(data.panelIds)]
        : [...new Set(data.slots.map((slot) => slot.panelId))];
    if (
      data.quoteData.type === "space" &&
      data.slots.some(
        (slot) =>
          slot.date < data.quoteData.date_start ||
          slot.date > data.quoteData.date_end ||
          !allowedTimes.has(slot.time),
      )
    ) {
      throw new Error("A seleção contém horários fora do período permitido.");
    }

    const [{ data: panels, error: panelsError }, { data: rawRules, error: rulesError }] =
      await Promise.all([
        supabase.from("panels").select("id").in("id", panelIds).eq("active", true),
        supabase
          .from("pricing_rules")
          .select(
            "id,panel_id,duration_seconds,base_price,discount_pct,date_start,date_end,time_start,time_end,weekday",
          )
          .in("panel_id", panelIds)
          .eq("duration_seconds", data.quoteData.duration_seconds),
      ]);
    if (panelsError) throw adminDatabaseError("Erro ao validar painéis", panelsError);
    if (rulesError) throw adminDatabaseError("Erro ao carregar preços", rulesError);
    if ((panels ?? []).length !== panelIds.length) {
      throw new Error("Um ou mais painéis selecionados não estão disponíveis.");
    }

    const rules: CampaignPricingRule[] = (rawRules ?? []).map((rule) => ({
      id: rule.id,
      panelId: rule.panel_id,
      durationSeconds: rule.duration_seconds,
      basePrice: Number(rule.base_price),
      discountPct: rule.discount_pct == null ? null : Number(rule.discount_pct),
      dateStart: rule.date_start,
      dateEnd: rule.date_end,
      timeStart: rule.time_start,
      timeEnd: rule.time_end,
      weekday: rule.weekday,
    }));
    const items =
      data.quoteData.type === "campaign"
        ? panelIds.map((panelId) => ({
            panel_id: panelId,
            date: data.quoteData.date_start,
            start_time: "08:00:00",
            duration_seconds: data.quoteData.duration_seconds,
            unit_price: CAMPAIGN_PANEL_DAILY_PRICE,
            final_price: CAMPAIGN_PANEL_DAILY_PRICE,
          }))
        : data.slots.map((slot) => {
            const unitPrice = calculateSpaceSlotPrice(
              slot,
              rules.filter((rule) => rule.panelId === slot.panelId),
            );
            return {
              panel_id: slot.panelId,
              date: slot.date,
              start_time: slot.time,
              duration_seconds: data.quoteData.duration_seconds,
              unit_price: unitPrice,
              final_price: unitPrice,
            };
          });
    const totalPrice =
      data.quoteData.type === "campaign"
        ? calculateCampaignTotal(
            panelIds.length,
            data.quoteData.date_start,
            data.quoteData.date_end,
          )
        : items.reduce((total, item) => total + item.final_price, 0);
    const { data: result, error } = await supabase
      .rpc("admin_create_campaign_for_user", {
        p_user_id: data.targetUserId,
        p_type: data.quoteData.type,
        p_date_start: data.quoteData.date_start,
        p_date_end: data.quoteData.date_end,
        p_duration_seconds: data.quoteData.duration_seconds,
        p_total_insertions: data.quoteData.total_insertions ?? null,
        p_total_price: totalPrice,
        p_expires_at: new Date(Date.now() + QUOTE_TTL_MINUTES * 60_000).toISOString(),
        p_items: items,
      })
      .single();
    if (error) throw adminDatabaseError("Erro ao criar campanha", error);
    return { quoteId: result.quote_id, orderId: result.order_id };
  });
