import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  adminBlackoutSchema,
  adminOperationIdSchema,
  adminPanelFormatSchema,
  adminPanelHourExceptionSchema,
  adminPanelHourSchema,
  adminPanelSchema,
  adminPricingRuleSchema,
  normalizeOperationTime,
  timeRangesOverlap,
} from "./operations-validation";
import { adminDatabaseError, requireAdminArea, requireAdminMutation } from "./shared";
import type {
  AdminOperationalPanel,
  AdminPanelBlackout,
  AdminPanelFormat,
  AdminPanelHour,
  AdminPanelHourException,
  AdminPanelHoursData,
  AdminPricingRule,
} from "./types";

function mapPanel(panel: {
  id: string;
  name: string;
  region: string;
  address: string;
  timezone: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}): AdminOperationalPanel {
  return {
    id: panel.id,
    name: panel.name,
    region: panel.region,
    address: panel.address,
    timezone: panel.timezone,
    active: panel.active,
    createdAt: panel.created_at,
    updatedAt: panel.updated_at,
  };
}

async function loadPanels(): Promise<AdminOperationalPanel[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("panels")
    .select("id,name,region,address,timezone,active,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (error) throw adminDatabaseError("Erro ao carregar painéis", error);
  return (data ?? []).map(mapPanel);
}

function panelLookup(panels: AdminOperationalPanel[]) {
  return new Map(panels.map((panel) => [panel.id, panel]));
}

export const getAdminPanels = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminArea();
  return loadPanels();
});

export function adminPanelsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["admin-operational-panels", userId] as const,
    queryFn: () => getAdminPanels(),
    staleTime: 30_000,
  });
}

export const saveAdminPanel = createServerFn({ method: "POST" })
  .validator(adminPanelSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const supabase = createServerSupabaseClient();
    const payload = {
      name: data.name,
      region: data.region,
      address: data.address,
      timezone: data.timezone,
      active: data.active,
    };
    const result = data.id
      ? await supabase.from("panels").update(payload).eq("id", data.id)
      : await supabase.from("panels").insert(payload);
    if (result.error) throw adminDatabaseError("Erro ao salvar painel", result.error);
    return { success: true } as const;
  });

export const getAdminPanelFormats = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ panels: AdminOperationalPanel[]; formats: AdminPanelFormat[] }> => {
    await requireAdminArea();
    const supabase = createServerSupabaseClient();
    const [panels, formatsResult] = await Promise.all([
      loadPanels(),
      supabase
        .from("panel_formats")
        .select("id,panel_id,width,height,orientation,durations_allowed,created_at")
        .order("created_at", { ascending: false }),
    ]);
    if (formatsResult.error)
      throw adminDatabaseError("Erro ao carregar formatos", formatsResult.error);
    const names = panelLookup(panels);
    return {
      panels,
      formats: (formatsResult.data ?? []).map((format) => ({
        id: format.id,
        panelId: format.panel_id,
        panelName: names.get(format.panel_id)?.name ?? "Painel não encontrado",
        panelActive: names.get(format.panel_id)?.active ?? false,
        width: format.width,
        height: format.height,
        orientation: format.orientation,
        durationsAllowed: format.durations_allowed,
        createdAt: format.created_at,
      })),
    };
  },
);

export function adminPanelFormatsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["admin-panel-formats", userId] as const,
    queryFn: () => getAdminPanelFormats(),
    staleTime: 30_000,
  });
}

export const saveAdminPanelFormat = createServerFn({ method: "POST" })
  .validator(adminPanelFormatSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const supabase = createServerSupabaseClient();
    const payload = {
      panel_id: data.panelId,
      width: data.width,
      height: data.height,
      orientation: data.orientation,
      durations_allowed: data.durationsAllowed,
    };
    const result = data.id
      ? await supabase.from("panel_formats").update(payload).eq("id", data.id)
      : await supabase.from("panel_formats").insert(payload);
    if (result.error) throw adminDatabaseError("Erro ao salvar formato", result.error);
    return { success: true } as const;
  });

export const deleteAdminPanelFormat = createServerFn({ method: "POST" })
  .validator(adminOperationIdSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const { error } = await createServerSupabaseClient()
      .from("panel_formats")
      .delete()
      .eq("id", data.id);
    if (error) throw adminDatabaseError("Erro ao excluir formato", error);
    return { success: true } as const;
  });

export const getAdminPanelHours = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminPanelHoursData> => {
    await requireAdminArea();
    const supabase = createServerSupabaseClient();
    const today = new Date().toISOString().slice(0, 10);
    const [panels, hoursResult, exceptionsResult, formatsResult, reservationsResult] =
      await Promise.all([
        loadPanels(),
        supabase
          .from("panel_hours")
          .select("id,panel_id,weekday,start_time,end_time,created_at")
          .order("panel_id")
          .order("weekday"),
        supabase
          .from("panel_hour_exceptions")
          .select("id,panel_id,date,start_time,end_time,created_at")
          .order("date"),
        supabase
          .from("panel_formats")
          .select("id,panel_id,width,height,orientation,durations_allowed,created_at"),
        supabase.from("reservations").select("panel_id,duration_seconds").gte("date", today),
      ]);
    const firstError =
      hoursResult.error ??
      exceptionsResult.error ??
      formatsResult.error ??
      reservationsResult.error;
    if (firstError) throw adminDatabaseError("Erro ao carregar horários", firstError);
    const names = panelLookup(panels);
    const formats: AdminPanelFormat[] = (formatsResult.data ?? []).map((format) => ({
      id: format.id,
      panelId: format.panel_id,
      panelName: names.get(format.panel_id)?.name ?? "Painel não encontrado",
      panelActive: names.get(format.panel_id)?.active ?? false,
      width: format.width,
      height: format.height,
      orientation: format.orientation,
      durationsAllowed: format.durations_allowed,
      createdAt: format.created_at,
    }));
    const hours: AdminPanelHour[] = (hoursResult.data ?? []).map((hour) => ({
      id: hour.id,
      panelId: hour.panel_id,
      panelName: names.get(hour.panel_id)?.name ?? "Painel não encontrado",
      panelActive: names.get(hour.panel_id)?.active ?? false,
      weekday: hour.weekday,
      startTime: hour.start_time,
      endTime: hour.end_time,
      createdAt: hour.created_at,
    }));
    const exceptions: AdminPanelHourException[] = (exceptionsResult.data ?? []).map(
      (exception) => ({
        id: exception.id,
        panelId: exception.panel_id,
        panelName: names.get(exception.panel_id)?.name ?? "Painel não encontrado",
        panelActive: names.get(exception.panel_id)?.active ?? false,
        date: exception.date,
        startTime: exception.start_time,
        endTime: exception.end_time,
        createdAt: exception.created_at,
      }),
    );
    return {
      panels,
      formats,
      hours,
      exceptions,
      futureReservations: (reservationsResult.data ?? []).map((reservation) => ({
        panelId: reservation.panel_id,
        durationSeconds: reservation.duration_seconds,
      })),
    };
  },
);

export function adminPanelHoursQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["admin-panel-hours", userId] as const,
    queryFn: () => getAdminPanelHours(),
    staleTime: 30_000,
  });
}

export const saveAdminPanelHour = createServerFn({ method: "POST" })
  .validator(adminPanelHourSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const supabase = createServerSupabaseClient();
    const payload = {
      panel_id: data.panelId,
      weekday: data.weekday,
      start_time: normalizeOperationTime(data.startTime),
      end_time: normalizeOperationTime(data.endTime),
    };
    const result = data.id
      ? await supabase.from("panel_hours").update(payload).eq("id", data.id)
      : await supabase.from("panel_hours").insert(payload);
    if (result.error) throw adminDatabaseError("Erro ao salvar horário", result.error);
    return { success: true } as const;
  });

export const deleteAdminPanelHour = createServerFn({ method: "POST" })
  .validator(adminOperationIdSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const { error } = await createServerSupabaseClient()
      .from("panel_hours")
      .delete()
      .eq("id", data.id);
    if (error) throw adminDatabaseError("Erro ao excluir horário", error);
    return { success: true } as const;
  });

export const saveAdminPanelHourException = createServerFn({ method: "POST" })
  .validator(adminPanelHourExceptionSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const supabase = createServerSupabaseClient();
    const payload = {
      panel_id: data.panelId,
      date: data.date,
      start_time: data.startTime ? normalizeOperationTime(data.startTime) : null,
      end_time: data.endTime ? normalizeOperationTime(data.endTime) : null,
    };
    const result = data.id
      ? await supabase.from("panel_hour_exceptions").update(payload).eq("id", data.id)
      : await supabase.from("panel_hour_exceptions").insert(payload);
    if (result.error) throw adminDatabaseError("Erro ao salvar exceção", result.error);
    return { success: true } as const;
  });

export const deleteAdminPanelHourException = createServerFn({ method: "POST" })
  .validator(adminOperationIdSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const { error } = await createServerSupabaseClient()
      .from("panel_hour_exceptions")
      .delete()
      .eq("id", data.id);
    if (error) throw adminDatabaseError("Erro ao excluir exceção", error);
    return { success: true } as const;
  });

export const getAdminPricingRules = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ panels: AdminOperationalPanel[]; rules: AdminPricingRule[] }> => {
    await requireAdminArea();
    const supabase = createServerSupabaseClient();
    const [panels, rulesResult] = await Promise.all([
      loadPanels(),
      supabase
        .from("pricing_rules")
        .select(
          "id,panel_id,weekday,time_start,time_end,duration_seconds,base_price,discount_pct,date_start,date_end,created_at",
        )
        .order("created_at", { ascending: false }),
    ]);
    if (rulesResult.error)
      throw adminDatabaseError("Erro ao carregar regras de preço", rulesResult.error);
    const names = panelLookup(panels);
    return {
      panels,
      rules: (rulesResult.data ?? []).map((rule) => ({
        id: rule.id,
        panelId: rule.panel_id,
        panelName: names.get(rule.panel_id)?.name ?? "Painel não encontrado",
        panelActive: names.get(rule.panel_id)?.active ?? false,
        weekday: rule.weekday,
        timeStart: rule.time_start,
        timeEnd: rule.time_end,
        durationSeconds: rule.duration_seconds,
        basePrice: Number(rule.base_price),
        discountPct: rule.discount_pct == null ? null : Number(rule.discount_pct),
        dateStart: rule.date_start,
        dateEnd: rule.date_end,
        createdAt: rule.created_at,
      })),
    };
  },
);

export function adminPricingRulesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["admin-pricing-rules", userId] as const,
    queryFn: () => getAdminPricingRules(),
    staleTime: 30_000,
  });
}

export const saveAdminPricingRule = createServerFn({ method: "POST" })
  .validator(adminPricingRuleSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const supabase = createServerSupabaseClient();
    const payload = {
      panel_id: data.panelId,
      duration_seconds: data.durationSeconds,
      base_price: data.basePrice,
      discount_pct: data.discountPct,
      date_start: data.dateStart,
      date_end: data.dateEnd,
      time_start: data.timeStart ? normalizeOperationTime(data.timeStart) : null,
      time_end: data.timeEnd ? normalizeOperationTime(data.timeEnd) : null,
      weekday: data.weekday,
    };
    const result = data.id
      ? await supabase.from("pricing_rules").update(payload).eq("id", data.id)
      : await supabase.from("pricing_rules").insert(payload);
    if (result.error) throw adminDatabaseError("Erro ao salvar regra de preço", result.error);
    return { success: true } as const;
  });

export const deleteAdminPricingRule = createServerFn({ method: "POST" })
  .validator(adminOperationIdSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const { error } = await createServerSupabaseClient()
      .from("pricing_rules")
      .delete()
      .eq("id", data.id);
    if (error) throw adminDatabaseError("Erro ao excluir regra de preço", error);
    return { success: true } as const;
  });

export const getAdminBlackouts = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ panels: AdminOperationalPanel[]; blackouts: AdminPanelBlackout[] }> => {
    await requireAdminArea();
    const supabase = createServerSupabaseClient();
    const [panels, blackoutsResult] = await Promise.all([
      loadPanels(),
      supabase
        .from("panel_blackouts")
        .select("id,panel_id,date,start_time,end_time,reason,created_at")
        .order("date"),
    ]);
    if (blackoutsResult.error)
      throw adminDatabaseError("Erro ao carregar bloqueios", blackoutsResult.error);
    const names = panelLookup(panels);
    return {
      panels,
      blackouts: (blackoutsResult.data ?? []).map((blackout) => ({
        id: blackout.id,
        panelId: blackout.panel_id,
        panelName: names.get(blackout.panel_id)?.name ?? "Painel não encontrado",
        panelActive: names.get(blackout.panel_id)?.active ?? false,
        date: blackout.date,
        startTime: blackout.start_time,
        endTime: blackout.end_time,
        reason: blackout.reason,
        createdAt: blackout.created_at,
      })),
    };
  },
);

export function adminBlackoutsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["admin-panel-blackouts", userId] as const,
    queryFn: () => getAdminBlackouts(),
    staleTime: 30_000,
  });
}

export const saveAdminBlackout = createServerFn({ method: "POST" })
  .validator(adminBlackoutSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const supabase = createServerSupabaseClient();
    let conflictsQuery = supabase
      .from("panel_blackouts")
      .select("id,start_time,end_time")
      .eq("panel_id", data.panelId)
      .eq("date", data.date);
    if (data.id) conflictsQuery = conflictsQuery.neq("id", data.id);
    const { data: existing, error: conflictsError } = await conflictsQuery;
    if (conflictsError)
      throw adminDatabaseError("Erro ao validar conflitos de bloqueio", conflictsError);
    if (
      (existing ?? []).some((blackout) =>
        timeRangesOverlap(data.startTime, data.endTime, blackout.start_time, blackout.end_time),
      )
    ) {
      throw new Error("Já existe um bloqueio sobreposto para este painel, data e horário.");
    }

    const payload = {
      panel_id: data.panelId,
      date: data.date,
      start_time: normalizeOperationTime(data.startTime),
      end_time: normalizeOperationTime(data.endTime),
      reason: data.reason || null,
    };
    const result = data.id
      ? await supabase.from("panel_blackouts").update(payload).eq("id", data.id)
      : await supabase.from("panel_blackouts").insert(payload);
    if (result.error) throw adminDatabaseError("Erro ao salvar bloqueio", result.error);
    return { success: true } as const;
  });

export const deleteAdminBlackout = createServerFn({ method: "POST" })
  .validator(adminOperationIdSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const { error } = await createServerSupabaseClient()
      .from("panel_blackouts")
      .delete()
      .eq("id", data.id);
    if (error) throw adminDatabaseError("Erro ao excluir bloqueio", error);
    return { success: true } as const;
  });
