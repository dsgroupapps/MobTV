import type { MediaTypeKey } from "@/data/network-points";

export type MidiaOption = "dooh" | "wifi" | "both";

export const midiaOptions: { value: MidiaOption; label: string; hint: string }[] = [
  { value: "dooh", label: "DOOH", hint: "Tela ou Painel LED" },
  { value: "wifi", label: "WiFi Ads", hint: "Publicidade via WiFi" },
  { value: "both", label: "DOOH + WiFi Ads", hint: "Inventário combinado" },
];

/**
 * Um ponto adicionado ao planejador + os tipos de mídia escolhidos naquele
 * local. `media` nunca fica vazio depois de confirmado — um ponto sem mídia
 * simplesmente não está na seleção. A `key` é a mesma chave estável já usada
 * no resto do planejador (`${categoria}::${nome}`), então um ponto aparece
 * uma única vez, com a lista de mídias, nunca duplicado por mídia.
 */
export type PlannerSelection = {
  key: string;
  media: MediaTypeKey[];
};

/** Configuração do simulador de campanha (Painel LED) — ver src/lib/planner/audience. */
export type PlannerSimConfig = {
  /** duração da campanha em dias (inteiro) */
  days: number;
  /** inserções por dia (inteiro) */
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
