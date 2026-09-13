import {
  networkPoints,
  campaignAvailableMediaTypes,
  type MediaTypeKey,
} from "../../data/network-points.ts";
import { findPointBySlug } from "../point-slug.ts";
import type {
  MidiaOption,
  PlannerSelection,
  PlannerSimConfig,
  PlannerStoredState,
} from "../../data/planner-options.ts";

/**
 * Persistência do PLANEJADOR PÚBLICO (seleção comercial pré-proposta).
 *
 * Totalmente isolado do portal autenticado: não toca em
 * `src/lib/campaign/storage.ts` nem em nenhuma chave `localStorage` de
 * panels/quotes/orders. Usa `sessionStorage` — a seleção sobrevive a refresh
 * e à navegação entre etapas, mas não vaza entre sessões/abas.
 */
export const STORAGE_KEY = "mobtv:planner:selection:v2";
export const LEGACY_STORAGE_KEY = "mobtv:planner:selection:v1";
const VALID_MEDIA: MediaTypeKey[] = ["screen", "led", "wifi"];
const VALID_MIDIA: MidiaOption[] = ["dooh", "wifi", "both"];

export function loadPlannerState(): PlannerStoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.sessionStorage.getItem(STORAGE_KEY) ??
      window.sessionStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const record = parsed as Record<string, unknown>;
    const midia =
      typeof record.midia === "string" && VALID_MIDIA.includes(record.midia as MidiaOption)
        ? (record.midia as MidiaOption)
        : null;

    const step =
      typeof record.step === "number" && Number.isFinite(record.step)
        ? Math.max(0, Math.min(2, Math.trunc(record.step)))
        : undefined;

    const rawSelections = Array.isArray(record.selections) ? record.selections : [];
    const selections: PlannerSelection[] = [];
    for (const item of rawSelections) {
      if (!item || typeof item !== "object") continue;
      const entry = item as Record<string, unknown>;
      const slug =
        typeof entry.slug === "string"
          ? entry.slug
          : typeof entry.key === "string"
            ? networkPoints.flatMap((category) =>
                category.points.filter((point) => `${category.key}::${point.nome}` === entry.key),
              )[0]?.slug
            : undefined;
      const found = slug ? findPointBySlug(slug) : undefined;
      if (!found) continue;
      // Só mídia comercialmente contratável hoje: uma seleção salva de WiFi
      // num ponto que deixou de ser `active` é descartada (não recriada
      // silenciosamente). DOOH e outras mídias do ponto seguem preservadas.
      const offered = campaignAvailableMediaTypes(found.point);
      const media = Array.isArray(entry.media)
        ? [
            ...new Set(
              entry.media.filter(
                (m): m is MediaTypeKey => VALID_MEDIA.includes(m) && offered.includes(m),
              ),
            ),
          ]
        : offered.length === 1
          ? offered
          : [];
      // Nunca expande uma escolha salva para todo o inventário do ponto.
      if (media.length === 0) continue;
      const selection = { slug: found.point.slug, media };
      const previous = selections.findIndex((item) => item.slug === selection.slug);
      if (previous >= 0) selections[previous] = selection;
      else selections.push(selection);
    }

    let sim: PlannerSimConfig | undefined;
    if (record.sim && typeof record.sim === "object") {
      const rawSim = record.sim as Record<string, unknown>;
      const days = Number(rawSim.days);
      const insertionsPerDay = Number(rawSim.insertionsPerDay);
      if (Number.isFinite(days) && Number.isFinite(insertionsPerDay)) {
        sim = { days: Math.trunc(days), insertionsPerDay: Math.trunc(insertionsPerDay) };
      }
    }

    return { midia, step, selections, sim };
  } catch {
    return null;
  }
}

export function savePlannerState(state: PlannerStoredState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // sessionStorage indisponível (modo privado restrito etc.) — segue sem persistir.
  }
}

export function clearPlannerState(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
