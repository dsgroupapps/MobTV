import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { advertiserDatabaseError, requireAdvertiser } from "./shared";
import type { AdvertiserCalendarPanel, AdvertiserCalendarReservation } from "./types";

const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const calendarReservationsInputSchema = z.object({
  date: calendarDateSchema,
  panelId: z.string().uuid().nullable(),
});
const rescheduleInputSchema = z.object({
  orderItemId: z.string().uuid(),
  date: calendarDateSchema,
  startTime: z.string().regex(/^\d{2}:\d{2}:00$/),
});

export const getAdvertiserCalendarPanels = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdvertiserCalendarPanel[]> => {
    const user = await requireAdvertiser();
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("order_items")
      .select("panel_id,panels(id,name),orders!inner(user_id)")
      .eq("orders.user_id", user.id);

    if (error) throw advertiserDatabaseError("Erro ao carregar painéis do calendário", error);

    const panels = new Map<string, AdvertiserCalendarPanel>();
    for (const item of data ?? []) {
      if (item.panels) panels.set(item.panels.id, item.panels);
    }
    return [...panels.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  },
);

export function advertiserCalendarPanelsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["advertiser-calendar-panels", userId] as const,
    queryFn: () => getAdvertiserCalendarPanels(),
    staleTime: 60_000,
  });
}

export const getAdvertiserCalendarReservations = createServerFn({ method: "GET" })
  .validator(calendarReservationsInputSchema)
  .handler(async ({ data }): Promise<AdvertiserCalendarReservation[]> => {
    const user = await requireAdvertiser();
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("order_items")
      .select(
        "id,panel_id,date,start_time,duration_seconds,panels(id,name),orders!inner(id,user_id,status)",
      )
      .eq("date", data.date)
      .eq("orders.user_id", user.id)
      .eq("orders.status", "paid");

    if (data.panelId) query = query.eq("panel_id", data.panelId);
    const { data: items, error } = await query;
    if (error) throw advertiserDatabaseError("Erro ao carregar reservas", error);

    return (items ?? []).map((item) => ({
      id: item.id,
      panelId: item.panel_id,
      panelName: item.panels?.name ?? "Painel desconhecido",
      orderId: item.orders.id,
      date: item.date,
      startTime: item.start_time,
      durationSeconds: item.duration_seconds,
    }));
  });

export function advertiserCalendarReservationsQueryOptions(
  userId: string,
  date: string,
  panelId: string | null,
) {
  return queryOptions({
    queryKey: ["advertiser-calendar-reservations", userId, date, panelId] as const,
    queryFn: () => getAdvertiserCalendarReservations({ data: { date, panelId } }),
    staleTime: 10_000,
  });
}

export const rescheduleAdvertiserOrderItem = createServerFn({ method: "POST" })
  .validator(rescheduleInputSchema)
  .handler(async ({ data }) => {
    await requireAdvertiser();
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.rpc("reschedule_own_order_item", {
      p_order_item_id: data.orderItemId,
      p_date: data.date,
      p_start_time: data.startTime,
    });

    if (error) throw advertiserDatabaseError("Erro ao remarcar reserva", error);
    return { success: true } as const;
  });
