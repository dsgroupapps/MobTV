/**
 * Opções fixas do Planejador de Campanha que NÃO vêm do Media Kit — são
 * categorias de objetivo de marketing, redação livre da MOBTV, sem
 * associação a nenhum dado comercial. Não confundir com `networkPoints`
 * ou `rate-card-2026.ts`, que são as únicas fontes de dado real usadas
 * para calcular investimento.
 */
export const objetivos = [
  { value: "reconhecimento", label: "Reconhecimento de marca" },
  { value: "divulgacao", label: "Divulgação de produto/serviço" },
  { value: "trafego", label: "Geração de tráfego" },
  { value: "captacao-wifi", label: "Captação via WiFi" },
  { value: "institucional", label: "Campanha institucional" },
] as const;

export type ObjetivoValue = (typeof objetivos)[number]["value"];

/**
 * As mesmas 16 cidades usadas em `CoverageMap.tsx` (Media Kit p.33/47 —
 * "16 das Principais Cidades do DF"). Duplicado aqui como lista simples de
 * nomes porque o CoverageMap não exporta o array e este arquivo não deve
 * alterá-lo. Qualquer alteração nas cidades cobertas precisa manter os
 * dois lugares em sincronia.
 */
export const regioesDisponiveis = [
  "Brazlândia",
  "Sobradinho II",
  "Sobradinho",
  "Planaltina",
  "Ceilândia",
  "Vicente Pires",
  "Taguatinga",
  "Guará",
  "Plano Piloto",
  "Samambaia",
  "Recanto das Emas",
  "Núcleo Bandeirante",
  "Riacho Fundo II",
  "São Sebastião",
  "Gama",
  "Santa Maria",
] as const;

export type MidiaOption = "dooh" | "wifi" | "both";

export const midiaOptions: { value: MidiaOption; label: string; hint: string }[] = [
  { value: "dooh", label: "DOOH", hint: "Telas e painéis — preço por inserção" },
  { value: "wifi", label: "WiFi Ads", hint: "Custo por engajamento (CPE)" },
  { value: "both", label: "DOOH + WiFi", hint: "Combina os dois formatos" },
];
