import type { MediaTypeKey } from "@/data/network-points";
import type {
  MidiaOption,
  PlannerSelection,
  PlannerSimConfig,
  PlannerStoredState,
} from "@/data/planner-options";

/**
 * Persistência do PLANEJADOR PÚBLICO (seleção comercial pré-proposta).
 *
 * Totalmente isolado do portal autenticado: não toca em
 * `src/lib/campaign/storage.ts` nem em nenhuma chave `localStorage` de
 * panels/quotes/orders. Usa `sessionStorage` — a seleção sobrevive a refresh
 * e à navegação entre etapas, mas não vaza entre sessões/abas.
 */
const STORAGE_KEY = "mobtv:planner:selection:v1";
const VALID_MEDIA: MediaTypeKey[] = ["screen", "led", "wifi"];
const VALID_MIDIA: MidiaOption[] = ["dooh", "wifi", "both"];

export function loadPlannerState(): PlannerStoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
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
      if (typeof entry.key !== "string") continue;
      const media = Array.isArray(entry.media)
        ? (entry.media.filter(
            (m): m is MediaTypeKey =>
              typeof m === "string" && VALID_MEDIA.includes(m as MediaTypeKey),
          ) as MediaTypeKey[])
        : [];
      // Compat: estado antigo pode não ter `media` — mantemos a `key` com
      // lista vazia; o componente decide (auto-seleciona se o ponto só tem 1
      // mídia, senão pede a escolha ao usuário — nunca escolhe arbitrária).
      selections.push({ key: entry.key, media: [...new Set(media)] });
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
  } catch {
    // sessionStorage indisponível (modo privado restrito etc.) — segue sem persistir.
  }
}

export function clearPlannerState(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
