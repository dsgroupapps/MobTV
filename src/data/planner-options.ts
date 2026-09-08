import type { MediaTypeKey } from "@/data/network-points";

export type MidiaOption = "dooh" | "wifi" | "both";

export const midiaOptions: { value: MidiaOption; label: string; hint: string }[] = [
  { value: "dooh", label: "DOOH", hint: "Tela ou Painel LED" },
  { value: "wifi", label: "WiFi Ads", hint: "Publicidade via WiFi" },
  { value: "both", label: "DOOH + WiFi Ads", hint: "Inventário combinado" },
];

/** Seleção comercial identificada pelo slug estável, com mídias explicitamente escolhidas. */
export type PlannerSelection = {
  slug: string;
  media: MediaTypeKey[];
};

/** Configuração comercial independente da disponibilidade de audiência. */
export type PlannerSimConfig = {
  /** duração da campanha em dias (inteiro) */
  days: number;
  /** Volume diário de referência da campanha DOOH; não por ponto nem acessos WiFi. */
  insertionsPerDay: number;
};

/** Formato persistido em sessionStorage (ver src/lib/planner/storage.ts). */
export type PlannerStoredState = {
  midia: MidiaOption | null;
  /** etapa atual (0-2) — para não cair na etapa 1 ao dar refresh na 2/3 */
  step?: number;
  selections: PlannerSelection[];
  /** entradas do "Simule sua campanha" — ausente em estado antigo */
  sim?: PlannerSimConfig;
};
