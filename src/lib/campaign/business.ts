import { z } from "zod";

export const CAMPAIGN_PANEL_DAILY_PRICE = 100;
export const SPACE_DEFAULT_SLOT_PRICE = 50;
export const QUOTE_TTL_MINUTES = 15;

export const CAMPAIGN_DURATIONS = [15, 30, 45, 60] as const;

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(new Date(`${value}T12:00:00`).getTime()), "Data inválida");

const durationSchema = z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]);

export const campaignBriefSchema = z
  .object({
    type: z.enum(["campaign", "space"]),
    date_start: calendarDateSchema,
    date_end: calendarDateSchema,
    duration_seconds: durationSchema,
    total_insertions: z.number().int().positive().optional(),
    regions: z.array(z.string()).default([]),
  })
  .superRefine((value, context) => {
    if (value.date_end < value.date_start) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date_end"],
        message: "A data final deve ser igual ou posterior à data inicial.",
      });
    }

    if (value.type === "campaign" && value.total_insertions == null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["total_insertions"],
        message: "Informe o total de inserções.",
      });
    }
  });

export type CampaignBrief = z.infer<typeof campaignBriefSchema>;

export const campaignPricingRuleSchema = z.object({
  id: z.string().uuid(),
  panelId: z.string().uuid(),
  durationSeconds: z.number().int(),
  basePrice: z.number(),
  discountPct: z.number().nullable(),
  dateStart: calendarDateSchema.nullable(),
  dateEnd: calendarDateSchema.nullable(),
  timeStart: z.string().nullable(),
  timeEnd: z.string().nullable(),
  weekday: z.number().int().min(0).max(6).nullable(),
});

export type CampaignPricingRule = z.infer<typeof campaignPricingRuleSchema>;

export const campaignPanelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  region: z.string(),
  address: z.string(),
  active: z.boolean(),
  timezone: z.string(),
  formats: z.array(
    z.object({
      id: z.string().uuid(),
      width: z.number().int(),
      height: z.number().int(),
      orientation: z.enum(["vertical", "horizontal", "ribbon"]),
      durationsAllowed: z.array(z.number().int()),
    }),
  ),
  pricingRules: z.array(campaignPricingRuleSchema),
});

export type CampaignPanel = z.infer<typeof campaignPanelSchema>;

export const selectedTimeSlotSchema = z.object({
  panelId: z.string().uuid(),
  date: calendarDateSchema,
  time: z.string().regex(/^\d{2}:\d{2}:00$/),
});

export const selectedTimeSlotsSchema = z.array(selectedTimeSlotSchema);
export type SelectedTimeSlot = z.infer<typeof selectedTimeSlotSchema>;

export const currentQuoteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.enum(["campaign", "space"]),
  date_start: calendarDateSchema.nullable(),
  date_end: calendarDateSchema.nullable(),
  duration_seconds: z.number().int().nullable(),
  total_insertions: z.number().int().nullable(),
  status: z.enum(["pending", "expired", "accepted", "cancelled"]),
  total_price: z.number(),
  expires_at: z.string(),
  created_at: z.string(),
});

export type CurrentQuote = z.infer<typeof currentQuoteSchema>;

export const createCampaignQuoteInputSchema = z.object({
  quoteData: campaignBriefSchema,
  panelIds: z
    .array(z.string().uuid())
    .min(1)
    .superRefine((ids, context) => {
      if (new Set(ids).size !== ids.length) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Painéis duplicados." });
      }
    }),
});

export const createSpaceQuoteInputSchema = z.object({
  quoteData: campaignBriefSchema,
  slots: selectedTimeSlotsSchema.min(1).superRefine((slots, context) => {
    const keys = slots.map((slot) => `${slot.panelId}|${slot.date}|${slot.time}`);
    if (new Set(keys).size !== keys.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Horários duplicados." });
    }
  }),
});

export function generateLegacyTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 6; hour < 23; hour += 1) {
    for (let minute = 0; minute < 60; minute += 5) {
      slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);
    }
  }
  return slots;
}

export function calculateCampaignTotal(
  panelCount: number,
  dateStart: string,
  dateEnd: string,
): number {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const days = Math.ceil(
    (new Date(dateEnd).getTime() - new Date(dateStart).getTime()) / millisecondsPerDay,
  );
  return panelCount * CAMPAIGN_PANEL_DAILY_PRICE * days;
}

export function calculateSpaceSlotPrice(
  slot: SelectedTimeSlot,
  rules: CampaignPricingRule[],
): number {
  const slotHour = Number(slot.time.split(":")[0]);
  const slotWeekday = new Date(`${slot.date}T12:00:00`).getDay();
  const applicableRule = rules.find((rule) => {
    const matchesDate =
      rule.dateStart == null ||
      (rule.dateEnd != null && slot.date >= rule.dateStart && slot.date <= rule.dateEnd);
    const matchesTime =
      rule.timeStart == null ||
      (rule.timeEnd != null &&
        slotHour >= Number(rule.timeStart.split(":")[0]) &&
        slotHour <= Number(rule.timeEnd.split(":")[0]));
    const matchesWeekday = rule.weekday == null || rule.weekday === slotWeekday;
    return matchesDate && matchesTime && matchesWeekday;
  });

  if (!applicableRule) return SPACE_DEFAULT_SLOT_PRICE;
  return calculateDiscountedPrice(applicableRule.basePrice, applicableRule.discountPct);
}

export function calculateDiscountedPrice(basePrice: number, discountPct: number | null): number {
  return basePrice * (1 - (discountPct ?? 0) / 100);
}
