import { queryOptions } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireCurrentRole } from "@/lib/auth/session.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CAMPAIGN_PANEL_DAILY_PRICE,
  QUOTE_TTL_MINUTES,
  calculateCampaignTotal,
  calculateSpaceSlotPrice,
  campaignPanelSchema,
  createCampaignQuoteInputSchema,
  createSpaceQuoteInputSchema,
  currentQuoteSchema,
  generateLegacyTimeSlots,
  type CampaignPanel,
  type CampaignPricingRule,
  type CurrentQuote,
} from "./business";

async function requireAdvertiser() {
  const user = await requireCurrentRole(["advertiser"]);
  if (user.role !== "advertiser") throw redirect({ href: "/admin" });
  return user;
}

function databaseError(context: string, error: { message: string }): Error {
  console.error(context, error);
  return new Error(`${context}: ${error.message}`);
}

export function mapCampaignPanel(panel: {
  id: string;
  name: string;
  region: string;
  address: string;
  active: boolean;
  timezone: string;
  panel_formats: Array<{
    id: string;
    width: number;
    height: number;
    orientation: "vertical" | "horizontal" | "ribbon";
    durations_allowed: number[];
  }> | null;
  pricing_rules: Array<{
    id: string;
    panel_id: string;
    duration_seconds: number;
    base_price: number;
    discount_pct: number | null;
    date_start: string | null;
    date_end: string | null;
    time_start: string | null;
    time_end: string | null;
    weekday: number | null;
  }> | null;
}): CampaignPanel {
  return campaignPanelSchema.parse({
    id: panel.id,
    name: panel.name,
    region: panel.region,
    address: panel.address,
    active: panel.active,
    timezone: panel.timezone,
    formats: (panel.panel_formats ?? []).map((format) => ({
      id: format.id,
      width: format.width,
      height: format.height,
      orientation: format.orientation,
      durationsAllowed: format.durations_allowed,
    })),
    pricingRules: (panel.pricing_rules ?? []).map((rule) => ({
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
    })),
  });
}

export const getCampaignInventory = createServerFn({ method: "GET" }).handler(
  async (): Promise<CampaignPanel[]> => {
    await requireAdvertiser();
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("panels")
      .select(
        "id,name,region,address,active,timezone,panel_formats(id,width,height,orientation,durations_allowed),pricing_rules(id,panel_id,duration_seconds,base_price,discount_pct,date_start,date_end,time_start,time_end,weekday)",
      )
      .eq("active", true);

    if (error) throw databaseError("Erro ao carregar painéis", error);
    return (data ?? []).map(mapCampaignPanel);
  },
);

export function campaignInventoryQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["campaign-inventory", userId] as const,
    queryFn: () => getCampaignInventory(),
    staleTime: 60_000,
  });
}

export const createCampaignQuote = createServerFn({ method: "POST" })
  .validator(createCampaignQuoteInputSchema)
  .handler(async ({ data }): Promise<CurrentQuote> => {
    const user = await requireAdvertiser();
    if (data.quoteData.type !== "campaign") throw new Error("Tipo de contratação inválido.");

    const supabase = createServerSupabaseClient();
    const uniquePanelIds = [...new Set(data.panelIds)];
    const { data: activePanels, error: panelsError } = await supabase
      .from("panels")
      .select("id")
      .in("id", uniquePanelIds)
      .eq("active", true);

    if (panelsError) throw databaseError("Erro ao validar painéis", panelsError);
    if ((activePanels ?? []).length !== uniquePanelIds.length) {
      throw new Error("Um ou mais painéis selecionados não estão disponíveis.");
    }

    const expiresAt = new Date(Date.now() + QUOTE_TTL_MINUTES * 60_000).toISOString();
    const totalPrice = calculateCampaignTotal(
      uniquePanelIds.length,
      data.quoteData.date_start,
      data.quoteData.date_end,
    );
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        user_id: user.id,
        type: "campaign",
        date_start: data.quoteData.date_start,
        date_end: data.quoteData.date_end,
        duration_seconds: data.quoteData.duration_seconds,
        total_insertions: data.quoteData.total_insertions,
        status: "pending",
        total_price: totalPrice,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (quoteError) throw databaseError("Erro ao gerar orçamento", quoteError);

    const { error: itemsError } = await supabase.from("quote_items").insert(
      uniquePanelIds.map((panelId) => ({
        quote_id: quote.id,
        panel_id: panelId,
        date: data.quoteData.date_start,
        start_time: "08:00:00",
        duration_seconds: data.quoteData.duration_seconds,
        unit_price: CAMPAIGN_PANEL_DAILY_PRICE,
        final_price: CAMPAIGN_PANEL_DAILY_PRICE,
      })),
    );

    if (itemsError) throw databaseError("Erro ao criar itens do orçamento", itemsError);
    return currentQuoteSchema.parse(quote);
  });

export const createSpaceQuote = createServerFn({ method: "POST" })
  .validator(createSpaceQuoteInputSchema)
  .handler(async ({ data }): Promise<CurrentQuote> => {
    const user = await requireAdvertiser();
    if (data.quoteData.type !== "space") throw new Error("Tipo de contratação inválido.");

    const allowedTimes = new Set(generateLegacyTimeSlots());
    if (
      data.slots.some(
        (slot) =>
          slot.date < data.quoteData.date_start ||
          slot.date > data.quoteData.date_end ||
          !allowedTimes.has(slot.time),
      )
    ) {
      throw new Error("A seleção contém horários fora do período permitido.");
    }

    const supabase = createServerSupabaseClient();
    const panelIds = [...new Set(data.slots.map((slot) => slot.panelId))];
    const [{ data: activePanels, error: panelsError }, { data: rawRules, error: rulesError }] =
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

    if (panelsError) throw databaseError("Erro ao validar painéis", panelsError);
    if (rulesError) throw databaseError("Erro ao carregar preços", rulesError);
    if ((activePanels ?? []).length !== panelIds.length) {
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
    const quoteItems = data.slots.map((slot) => {
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
    const totalPrice = quoteItems.reduce((total, item) => total + item.final_price, 0);
    const expiresAt = new Date(Date.now() + QUOTE_TTL_MINUTES * 60_000).toISOString();
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        user_id: user.id,
        type: "space",
        date_start: data.quoteData.date_start,
        date_end: data.quoteData.date_end,
        duration_seconds: data.quoteData.duration_seconds,
        status: "pending",
        total_price: totalPrice,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (quoteError) throw databaseError("Erro ao gerar orçamento", quoteError);

    const { error: itemsError } = await supabase.from("quote_items").insert(
      quoteItems.map((item) => ({
        quote_id: quote.id,
        ...item,
      })),
    );

    if (itemsError) throw databaseError("Erro ao criar itens do orçamento", itemsError);
    return currentQuoteSchema.parse(quote);
  });

export const confirmSimulatedPayment = createServerFn({ method: "POST" })
  .validator(z.object({ quoteId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const user = await requireAdvertiser();
    const supabase = createServerSupabaseClient();
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*,quote_items(*)")
      .eq("id", data.quoteId)
      .eq("user_id", user.id)
      .single();

    if (quoteError || !quote) throw new Error("Erro ao buscar orçamento.");
    if (quote.status !== "pending") throw new Error("Este orçamento não está mais pendente.");
    if (new Date(quote.expires_at).getTime() <= Date.now()) {
      throw new Error("Este orçamento expirou. Gere um novo orçamento para continuar.");
    }
    if (quote.quote_items.length === 0) throw new Error("O orçamento não possui itens.");

    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("quote_id", quote.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingOrder) return { orderId: existingOrder.id, alreadyCreated: true } as const;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        quote_id: quote.id,
        status: "paid",
        total_amount: quote.total_price,
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) throw databaseError("Erro ao criar pedido", orderError);

    const { error: itemsError } = await supabase.from("order_items").insert(
      quote.quote_items.map((item) => ({
        order_id: order.id,
        panel_id: item.panel_id,
        date: item.date,
        start_time: item.start_time,
        duration_seconds: item.duration_seconds,
        unit_price: item.unit_price,
        final_price: item.final_price,
      })),
    );

    if (itemsError) throw databaseError("Erro ao criar itens do pedido", itemsError);

    const { error: updateError } = await supabase
      .from("quotes")
      .update({ status: "accepted" })
      .eq("id", quote.id)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (updateError) throw databaseError("Erro ao confirmar orçamento", updateError);
    return { orderId: order.id, alreadyCreated: false } as const;
  });
