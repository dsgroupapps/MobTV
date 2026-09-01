import { totalPointsCount } from "./network-points";

/**
 * Dados institucionais da MOBTV — fonte única de verdade.
 *
 * Todos os valores abaixo foram conferidos manualmente contra o Media Kit
 * oficial ("MIDIA KIT MOBTV - DOOH WIFI LEADS (varejo) - COMPLETO.pdf",
 * tabela de preços válida para 2026). Os comentários indicam a página do
 * PDF onde cada número aparece, para permitir reconferência futura.
 *
 * Métricas diferentes representam universos diferentes e não devem ser
 * somadas ou tratadas como equivalentes entre si (ver campo `scope` em
 * cada bloco).
 *
 * O rate card comercial granular (preço por ponto, por inserção, CPE do
 * WiFi Ads, inventário de monitores nomeado) vive em `rate-card-2026.ts`,
 * no mesmo diretório — separado deste arquivo porque tem outro formato
 * (listas de pontos, não KPIs agregados) e outra fonte de página do PDF
 * (p.28, p.39, p.60–62).
 */

/** Total de impactos com contagem auditada por câmera + IA (Metrô + BRT). */
export const auditedImpacts = {
  value: 11_986_541,
  scope: "Metrô + BRT — painéis com auditoria por câmera e IA (Datavisiooh)",
  source:
    'Media Kit p.39, tabela "Auditoria" — Total de Impactos Auditáveis. Fonte: Datavisiooh, dados de 2024.',
};

/**
 * Pegada física exibida nas seções institucionais atuais. A contagem de
 * pontos vem do catálogo nominal usado por /rede (`network-points.ts`), para
 * não divergir do acervo atual. A quantidade de cidades permanece o número
 * institucional do Media Kit.
 */
export const networkFootprint = {
  points: totalPointsCount,
  cities: 16,
  source: "Pontos: catálogo nominal atual (`network-points.ts`). Cidades: Media Kit p.33 e p.47.",
};

/**
 * Alcance mensal aproximado (não é o número auditado acima — o próprio
 * Media Kit rotula estes dois valores como "*Alcance aproximado").
 */
export const approxReach = {
  combinedMillions: 15, // WiFi + DOOH + Painéis LED combinados — Media Kit p.33
  wifiOnlyMillions: 3.5, // Somente rede WiFi Ads — Media Kit p.47
  disclaimer: "Alcance aproximado",
  source:
    'Media Kit p.33 ("+15 milhões de impactos") e p.47 ("+3,5 milhões de impactos"), ambos marcados como *Alcance aproximado.',
};

/** Rede de monitores e painéis de LED (subconjunto DOOH, sem WiFi). */
export const ledNetwork = {
  screens: 39,
  locations: 27,
  monthlyImpactsMillions: 10, // "+10 Milhões de impactos por mês"
  source: 'Media Kit p.1 e p.27 — "39 Telas · 27 Locais" / "+10 Milhões de impactos por mês".',
};

/** Perfil macroeconômico de Brasília, usado para justificar o mercado. */
export const marketProfile = {
  pib: "R$ 328,8 bi",
  incomeRanking: "Maior",
  population: "~3 milhões",
  economySector: "Serviços",
  source: 'Media Kit p.1, seção "O Mercado".',
};

/** Indicadores de eficiência do WiFi Ads. */
export const wifiAdsEfficiency = {
  viewability: "100%",
  ctr: ">65%",
  ctrBenchmarkVideo: "2,7%",
  ctrBenchmarkBanner: "0,4%",
  source: 'Media Kit p.44 — "Wi-Fi Ads: Eficiência acima da média".',
};

/** Comparativo de custo x benefício entre formatos de mídia. */
export const costComparison = [
  {
    name: "Banner Display",
    kpi: "CPM",
    kpiValue: "R$ 25,00",
    conv: "0,04%",
    invest: "R$ 62.500,00",
    highlight: false,
  },
  {
    name: "Video Ads",
    kpi: "CPM",
    kpiValue: "R$ 250,00",
    conv: "2,7%",
    invest: "R$ 9.259,26",
    highlight: false,
  },
  {
    name: "Wi-Fi Ads MOBTV",
    kpi: "CPE",
    kpiValue: "R$ 8,00",
    conv: "100%",
    invest: "R$ 8.000,00",
    highlight: true,
  },
] as const;
// Media Kit p.45 — "Wi-Fi Ads: Compare o custo x benefício".

/** Perfil demográfico e de consumo por tipo de local. */
export const audienceProfile = {
  metroBrt: {
    age: "18 a 45 anos",
    female: 53.4,
    male: 45.4,
    dwellTime: "6 a 15 minutos",
    // Media Kit: "Alimentação rápida, tecnologia, moda e serviços financeiros"
    // (redação abaixo mantém a pontuação já usada no site — mesma lista, sem o "e" final).
    categories: "alimentação rápida, tecnologia, moda, serviços financeiros",
  },
  upasHospitais: {
    age: "25 a 60 anos",
    female: 51,
    male: 49,
    dwellTime: "1 hora ou mais",
    // Media Kit: "Planos de saúde, farmácias, seguros, alimentação saudável e serviços financeiros"
    categories: "planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros",
  },
  source: 'Media Kit p.6 e p.7 — "Perfil Demográfico e Padrão de Consumo dos Usuários".',
} as const;

/** Pesquisa de padrão de consumo coletada via enquete nas redes WiFi. */
export const consumerResearch = [
  { value: "45,2%", text: "costumam fazer compras online" },
  { value: "43,9%", text: "apontam a Shopee como plataforma mais utilizada" },
  { value: "44,1%", text: "têm o celular como principal sonho de consumo para os próximos meses" },
  { value: "41,8%", text: "planejam fazer uma faculdade nos próximos anos" },
  { value: "38,1%", text: "apontam saúde da mulher como tema de saúde mais relevante" },
  { value: "41,9%", text: "escolhem o cinema como opção preferida de lazer" },
] as const;
// Fonte: "Pesquias Wi-fi - DF.pdf", p.2 a p.7.

/**
 * Fluxo mensal aproximado de pessoas por ambiente/categoria de ponto.
 * Cada valor vem de uma página distinta do Media Kit e descreve um
 * ambiente específico — não são somáveis entre si nem com os totais de
 * rede acima (ver `networkFootprint`/`approxReach`).
 */
export const environmentMonthlyFlow = {
  saude: {
    label: "Saúde",
    display: "250 mil",
    unit: "pessoas/mês",
    source: 'Media Kit p.49 — "Hospitais: fluxo mensal de mais de 250 mil pessoas!".',
  },
  transportes: {
    label: "Transportes",
    display: "3 milhões",
    unit: "pessoas/mês",
    source: 'Media Kit p.51 — "Transporte Público: fluxo mensal de mais de 3 milhões de pessoas!".',
  },
  servicos: {
    label: "Serviços (Na Hora)",
    display: "90 mil",
    unit: "pessoas/mês",
    source: 'Media Kit p.46 — "Na Hora: fluxo mensal de mais de 90 mil pessoas!".',
  },
  feiras: {
    label: "Feiras",
    display: "1,2 milhão",
    unit: "pessoas/mês",
    source: 'Media Kit p.48 — "Feiras: fluxo mensal de mais de 1,2 milhão de pessoas!".',
  },
  upasUbs: {
    label: "UPAs e UBSs",
    display: "210 mil",
    unit: "pessoas/mês",
    source: 'Media Kit p.50 — "UPAs e UBSs: fluxo mensal de mais de 210 mil pessoas!".',
  },
} as const;
