import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { addDays, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDatabaseError, requireAdminArea } from "./shared";
import type { AdminDashboardData } from "./types";

function timeToMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export const getAdminDashboardData = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminDashboardData> => {
    await requireAdminArea();
    const supabase = createServerSupabaseClient();
    const weekStart = startOfWeek(new Date(), { locale: ptBR });
    const weekEnd = addDays(weekStart, 6);
    const dateStart = format(weekStart, "yyyy-MM-dd");
    const dateEnd = format(weekEnd, "yyyy-MM-dd");

    const [
      panelsResult,
      ordersResult,
      itemsResult,
      exhibitionsResult,
      reservationsResult,
      hoursResult,
    ] = await Promise.all([
      supabase
        .from("panels")
        .select("id,name", { count: "exact" })
        .eq("active", true)
        .order("name"),
      supabase.from("orders").select("user_id,status,total_amount"),
      supabase.from("order_items").select("id,panel_id,panels(name)"),
      supabase
        .from("opp_logs")
        .select("id", { count: "exact", head: true })
        .eq("status", "success"),
      supabase
        .from("reservations")
        .select("panel_id,date,duration_seconds")
        .gte("date", dateStart)
        .lte("date", dateEnd),
      supabase.from("panel_hours").select("panel_id,weekday,start_time,end_time"),
    ]);

    const errors = [
      panelsResult.error,
      ordersResult.error,
      itemsResult.error,
      exhibitionsResult.error,
      reservationsResult.error,
      hoursResult.error,
    ].filter((error): error is NonNullable<typeof error> => error != null);
    if (errors[0])
      throw adminDatabaseError("Erro ao carregar o dashboard administrativo", errors[0]);

    const panels = panelsResult.data ?? [];
    const orders = ordersResult.data ?? [];
    const items = itemsResult.data ?? [];
    const paidOrders = orders.filter((order) => order.status === "paid");
    const activeOrders = orders.filter(
      (order) => order.status === "paid" || order.status === "released",
    );
    const panelCounts = new Map<string, number>();
    for (const item of items) {
      const panelName = item.panels?.name ?? "Desconhecido";
      panelCounts.set(panelName, (panelCounts.get(panelName) ?? 0) + 1);
    }

    const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    const reservations = reservationsResult.data ?? [];
    const hours = hoursResult.data ?? [];
    const occupancy = panels.map((panel) => ({
      panelId: panel.id,
      panelName: panel.name,
      days: weekDates.map((date, weekday) => {
        const dateKey = format(date, "yyyy-MM-dd");
        const availableMinutes = hours
          .filter((entry) => entry.panel_id === panel.id && entry.weekday === weekday)
          .reduce(
            (total, entry) =>
              total + Math.max(0, timeToMinutes(entry.end_time) - timeToMinutes(entry.start_time)),
            0,
          );
        const occupiedMinutes = reservations
          .filter((entry) => entry.panel_id === panel.id && entry.date === dateKey)
          .reduce((total, entry) => total + entry.duration_seconds / 60, 0);
        return {
          date: dateKey,
          occupancy:
            availableMinutes > 0 ? Math.min(100, (occupiedMinutes / availableMinutes) * 100) : 0,
        };
      }),
    }));

    return {
      metrics: {
        activePanels: panelsResult.count ?? panels.length,
        totalRevenue: paidOrders.reduce((total, order) => total + Number(order.total_amount), 0),
        activeCampaigns: activeOrders.length,
        pendingCampaigns: orders.filter((order) => order.status === "pending").length,
        totalInsertions: items.length,
        advertisers: new Set(paidOrders.map((order) => order.user_id)).size,
        exhibitions: exhibitionsResult.count ?? 0,
      },
      panelStats: [...panelCounts.entries()]
        .map(([panelName, count]) => ({ panelName, count }))
        .sort((a, b) => b.count - a.count),
      occupancy,
      weekDays: weekDates.map((date) => format(date, "EEE dd", { locale: ptBR })),
    };
  },
);

export function adminDashboardQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["admin-dashboard", userId] as const,
    queryFn: () => getAdminDashboardData(),
    staleTime: 30_000,
  });
}
