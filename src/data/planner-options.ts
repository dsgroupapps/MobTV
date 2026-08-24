export type MidiaOption = "dooh" | "wifi" | "both";

export const midiaOptions: { value: MidiaOption; label: string; hint: string }[] = [
  { value: "dooh", label: "DOOH", hint: "Tela ou Painel LED" },
  { value: "wifi", label: "WiFi Ads", hint: "Publicidade via WiFi" },
  { value: "both", label: "DOOH + WiFi Ads", hint: "Inventário combinado" },
];
