import type { z } from "zod";

import {
  campaignBriefSchema,
  campaignPanelSchema,
  currentQuoteSchema,
  selectedTimeSlotsSchema,
  type CampaignBrief,
  type CampaignPanel,
  type CurrentQuote,
  type SelectedTimeSlot,
} from "./business";

const STORAGE_KEYS = {
  quoteData: "quoteData",
  selectedPanels: "selectedPanels",
  selectedSlots: "selectedSlots",
  currentQuote: "currentQuote",
} as const;

function readStorage<Schema extends z.ZodTypeAny>(
  key: string,
  schema: Schema,
): z.output<Schema> | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(key);
  if (!stored) return null;

  try {
    const result = schema.safeParse(JSON.parse(stored));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readCampaignBrief(): CampaignBrief | null {
  return readStorage(STORAGE_KEYS.quoteData, campaignBriefSchema);
}

export function writeCampaignBrief(value: CampaignBrief): void {
  writeStorage(STORAGE_KEYS.quoteData, value);
}

export function readSelectedPanels(): CampaignPanel[] {
  return readStorage(STORAGE_KEYS.selectedPanels, campaignPanelSchema.array()) ?? [];
}

export function writeSelectedPanels(value: CampaignPanel[]): void {
  writeStorage(STORAGE_KEYS.selectedPanels, value);
}

export function readSelectedSlots(): SelectedTimeSlot[] {
  return readStorage(STORAGE_KEYS.selectedSlots, selectedTimeSlotsSchema) ?? [];
}

export function writeSelectedSlots(value: SelectedTimeSlot[]): void {
  writeStorage(STORAGE_KEYS.selectedSlots, value);
}

export function readCurrentQuote(): CurrentQuote | null {
  return readStorage(STORAGE_KEYS.currentQuote, currentQuoteSchema);
}

export function writeCurrentQuote(value: CurrentQuote): void {
  writeStorage(STORAGE_KEYS.currentQuote, value);
}

export function removeSelectedPanels(): void {
  window.localStorage.removeItem(STORAGE_KEYS.selectedPanels);
}

export function removeSelectedSlots(): void {
  window.localStorage.removeItem(STORAGE_KEYS.selectedSlots);
}

export function clearCompletedCampaignStorage(): void {
  window.localStorage.removeItem(STORAGE_KEYS.quoteData);
  window.localStorage.removeItem(STORAGE_KEYS.currentQuote);
  window.localStorage.removeItem(STORAGE_KEYS.selectedPanels);
  window.localStorage.removeItem(STORAGE_KEYS.selectedSlots);
}
