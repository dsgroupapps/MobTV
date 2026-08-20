/**
 * Rate card comercial MOBTV — Tabela de Preços válida para o ano de 2026.
 *
 * Fonte única: Media Kit oficial ("MIDIA KIT MOBTV - DOOH WIFI LEADS (varejo) -
 * COMPLETO.pdf"), páginas 60–62 ("Tabela de Preços"). Assinado por Fabio Rosa,
 * Diretor Executivo, DS Serviços de Comunicação e Consultoria LTDA.
 *
 * Este arquivo é a base de dados granular (por ponto/local) que sustenta
 * qualquer experiência futura de exploração de ativos, mapa comercial ou
 * simulador de campanha (Etapa 2+ do roadmap MOBTV 2.0). Nenhum valor aqui
 * foi estimado — cada preço, fluxo e localização vem literalmente da tabela
 * assinada. Onde o Media Kit não detalha um dado (ex.: disponibilidade em
 * tempo real, alcance por ponto fora do Metrô), esse dado simplesmente não
 * existe neste arquivo — não deve ser inferido em nenhum componente.
 *
 * Preços em reais (BRL), representando custo por inserção (DOOH) ou por CPE
 * — Custo Por Engajamento (WiFi Ads). Não confundir com CPM.
 */

export const rateCardMeta = {
  validaPara: 2026,
  razaoSocial: "DS Serviços de Comunicação e Consultoria LTDA",
  cnpj: "05.806.588/0001-99",
  inscricaoEstadual: "07.447.434/001-90",
  endereco: "SIG Quadra 8, Lote 2.268, Sala 202 - Brasília DF - CEP 70610-480",
  telefone: "(61) 3551-9886",
  source: "Media Kit p.60-62",
} as const;

/** Monitores e painéis DOOH fora do Metrô (UPAs, Hospitais, Feira, Terminais). */
export type DoohMonitorPoint = {
  descricao: string;
  custoInsercao15s: number;
  custoInsercao30s: number;
  tipo: string;
};

export type DoohMonitorGrupo = {
  categoria: string;
  monitoresTotal: number;
  pontos: DoohMonitorPoint[];
};

export const doohMonitorRateCard2026: DoohMonitorGrupo[] = [
  {
    categoria: "DF — UPAs",
    monitoresTotal: 10,
    pontos: [
      "UPA Ceilândia",
      "UPA Samambaia",
      "UPA Sobradinho II",
      "UPA São Sebastião",
      "UPA Recanto das Emas",
      "UPA Riacho Fundo",
      "UPA Rajadinha Planaltina",
      "UPA Brazlândia",
      "UPA Vicente Pires",
      "UPA Gama",
    ].map((descricao) => ({
      descricao,
      custoInsercao15s: 1.9,
      custoInsercao30s: 3.32,
      tipo: 'Monitor 49"',
    })),
  },
  {
    categoria: "DF — Hospitais",
    monitoresTotal: 7,
    pontos: [
      {
        descricao: "Hospital do Gama (1 monitor)",
        custoInsercao15s: 1.9,
        custoInsercao30s: 3.32,
        tipo: 'Monitor 49"',
      },
      {
        descricao: "Hospital de Ceilândia (2 monitores)",
        custoInsercao15s: 1.9,
        custoInsercao30s: 3.32,
        tipo: 'Monitor 49"',
      },
      {
        descricao: "Hospital de Taguatinga (2 monitores)",
        custoInsercao15s: 1.9,
        custoInsercao30s: 3.32,
        tipo: 'Monitor 49"',
      },
      {
        descricao: "Hospital de Santa Maria (2 monitores)",
        custoInsercao15s: 1.9,
        custoInsercao30s: 3.32,
        tipo: 'Monitor 49"',
      },
    ],
  },
  {
    categoria: "DF — Feira",
    monitoresTotal: 2,
    pontos: [
      {
        descricao: "Feira do Guará (2 monitores)",
        custoInsercao15s: 1.9,
        custoInsercao30s: 3.32,
        tipo: 'Monitor 49"',
      },
    ],
  },
  {
    categoria: "DF — Terminais Rodoviários",
    monitoresTotal: 13,
    pontos: [
      {
        descricao: "Terminal BRT Gama (3 painéis de LED)",
        custoInsercao15s: 3.2,
        custoInsercao30s: 5.81,
        tipo: "LED 2x1m",
      },
      {
        descricao: "Terminal BRT Santa Maria (3 painéis de LED)",
        custoInsercao15s: 3.2,
        custoInsercao30s: 5.81,
        tipo: "LED 2x1m",
      },
      {
        descricao: "Terminal BRT Gama (2 monitores)",
        custoInsercao15s: 1.9,
        custoInsercao30s: 3.32,
        tipo: 'Monitor 49"',
      },
      {
        descricao: "Terminal BRT Santa Maria (2 monitores)",
        custoInsercao15s: 1.9,
        custoInsercao30s: 3.32,
        tipo: 'Monitor 49"',
      },
      {
        descricao: 'Terminal do "Setor O" (3 monitores)',
        custoInsercao15s: 1.9,
        custoInsercao30s: 3.32,
        tipo: 'Monitor 49"',
      },
    ],
  },
];
// Fonte: Media Kit p.60 — "Tabela de Preços — Monitores DOOH Brasília". Tabela válida para 2026.

/** Painéis de LED no Metrô-DF — únicos pontos com fluxo mensal detalhado por painel. */
export type LedMetroPonto = {
  estacao: string;
  fluxoMensal: number;
  localizacao: string;
  custoInsercao15s: number;
  formato: string;
};

export const ledMetroRateCard2026: LedMetroPonto[] = [
  {
    estacao: "Estação Central",
    fluxoMensal: 478_000,
    localizacao: "Painel LED — fluxo de saída da estação",
    custoInsercao15s: 4.9,
    formato: "LED 4x1,2m",
  },
  {
    estacao: "Estação Central",
    fluxoMensal: 478_000,
    localizacao: "Painel LED — fluxo de entrada da estação",
    custoInsercao15s: 4.9,
    formato: "LED 3x1,2m",
  },
  {
    estacao: "Estação Águas Claras",
    fluxoMensal: 269_000,
    localizacao: "Plataforma de embarque e desembarque",
    custoInsercao15s: 3.2,
    formato: "LED 3x1m",
  },
  {
    estacao: "Estação Arniqueiras",
    fluxoMensal: 275_000,
    localizacao: "Fluxo de saída da estação, ao lado das catracas",
    custoInsercao15s: 3.2,
    formato: "LED 3x1m",
  },
  {
    estacao: "Estação Shopping",
    fluxoMensal: 263_000,
    localizacao: "Fluxo de entrada da estação, ao lado das catracas",
    custoInsercao15s: 3.2,
    formato: "LED 3x2m",
  },
  {
    estacao: "Estação Praça do Relógio",
    fluxoMensal: 204_000,
    localizacao: "Hall de acesso às plataformas de embarque/desembarque",
    custoInsercao15s: 3.2,
    formato: "LED 2,2x3m",
  },
];
// Fonte: Media Kit p.61 — "Tabela de Preços — DOOH Metrô DF". Tabela válida para 2026.
// Fluxo mensal por estação também aparece no "Mapa de Cobertura Metrô-DF" (p.15), com os
// mesmos 5 valores — dado corroborado em duas páginas distintas do Media Kit.

/** WiFi Ads — custo por engajamento (CPE), fixo em R$8,00 em todos os pontos do rate card. */
export type WifiAdsGrupo = {
  categoria: string;
  pontos: string[];
  valorPorCpe: number;
  formato: string;
};

export const wifiAdsFormatSpec = {
  banner: "560×735px",
  video: "até 60 segundos",
  formatosVideoAceitos: ["1920×1080px", "700×1060px"],
  source: "Media Kit p.62",
} as const;

export const wifiAdsRateCard2026: WifiAdsGrupo[] = [
  {
    categoria: "DF — UPAs/UBS",
    pontos: [
      "UPA Gama",
      "UPA Ceilândia",
      "UPA Setor O",
      "UPA Samambaia",
      "UPA Vicente Pires",
      "UPA Recanto das Emas",
      "UPA Riacho Fundo",
      "UPA Sobradinho II",
      "UPA Planaltina",
      "UPA Brazlândia",
    ],
    valorPorCpe: 8.0,
    formato: "Engajamento (CPE)",
  },
  {
    categoria: "DF — Hospitais",
    pontos: [
      "Hospital do Gama",
      "Hospital de Ceilândia",
      "Hospital de Taguatinga",
      "Hospital de Santa Maria",
    ],
    valorPorCpe: 8.0,
    formato: "Engajamento (CPE)",
  },
  {
    categoria: "DF — Feiras",
    pontos: [
      "Feira Ceilândia",
      "Feira Samambaia",
      "Feira dos Goianos",
      "Feira Sobradinho I",
      "Feira do Guará",
      "Feira Samambaia 2",
    ],
    valorPorCpe: 8.0,
    formato: "Engajamento (CPE)",
  },
  {
    categoria: "DF — Terminais Rodoviários",
    pontos: [
      "BRT do Gama",
      "Terminal de Santa Maria",
      'Terminal do "Setor O"',
      "Terminal de Sobradinho",
      "Rodoviária Interestadual",
    ],
    valorPorCpe: 8.0,
    formato: "Engajamento (CPE)",
  },
  {
    categoria: "DF — Na Hora",
    pontos: [
      "Na Hora do Gama",
      "Na Hora Ceilândia",
      "Na Hora Taguatinga",
      "Na Hora Sobradinho",
      "Na Hora Rodoviária",
    ],
    valorPorCpe: 8.0,
    formato: "Engajamento (CPE)",
  },
  {
    categoria: "DF — Estações de Metrô",
    pontos: [
      "Estação Shopping",
      "Estação Arniqueiras",
      "Estação Central",
      "Estação Águas Claras",
      "Estação Ceilândia Centro",
      "Estação Guariroba",
      "Estação Ceilândia Sul",
      "Estação Ceilândia Norte",
      "Estação Feira",
      "Estação Guará",
    ],
    valorPorCpe: 8.0,
    formato: "Engajamento (CPE)",
  },
];
// Fonte: Media Kit p.62 — "Tabela de Preços — WiFi Ads Mídia Online". Tabela válida para 2026.
// Esta lista é a do rate card comercial especificamente — não é necessariamente a enumeração
// completa do acervo nominal atual (`network-points.ts`). Métricas agregadas do Media Kit
// e listas comerciais não devem ser somadas nem tratadas como o mesmo universo.

/**
 * Auditoria de impactos por ponto — únicos 10 painéis com contagem individual
 * publicada (câmera + IA, Datavisiooh). A soma bate exatamente com
 * `auditedImpacts.value` em mobtv-data.ts (11.986.541).
 */
export const auditImpactBreakdown2024 = [
  { local: "Metrô Praça do Relógio", impactosMes: 1_063_504 },
  { local: "Metrô Central — Entrada", impactosMes: 1_025_704 },
  { local: "Metrô Central — Escada", impactosMes: 1_141_956 },
  { local: "Metrô Shopping", impactosMes: 732_239 },
  { local: "Metrô Arniqueiras", impactosMes: 1_128_365 },
  { local: "Metrô Águas Claras", impactosMes: 1_000_000 },
  { local: "BRT Gama 1", impactosMes: 789_953 },
  { local: "BRT Gama 2", impactosMes: 1_359_220 },
  { local: "BRT Santa Maria 1", impactosMes: 2_985_180 },
  { local: "BRT Santa Maria 2", impactosMes: 760_420 },
] as const;
// Fonte: Media Kit p.39 — tabela "Auditoria" (Local / Impactos por mês), Datavisiooh, dados de 2024.
// Soma = 11.986.541, idêntica a auditedImpacts.value (mobtv-data.ts) — dado reconciliado.

/** Inventário nomeado de monitores/painéis de LED — 27 locais, 39 telas ao todo. */
export const ledMonitorInventory2026 = [
  { local: "Feira do Guará", monitores: 2 },
  { local: "Hospital Regional de Ceilândia", monitores: 2 },
  { local: "Hospital Regional de Taguatinga", monitores: 2 },
  { local: "Hospital Regional do Gama", monitores: 1 },
  { local: "Hospital Regional de Santa Maria", monitores: 2 },
  { local: "Terminal do BRT de Santa Maria", monitores: 2 },
  { local: "Terminal do BRT do Gama", monitores: 2 },
  { local: 'Terminal do "Setor O"', monitores: 3 },
  { local: "Terminal Rodoviário de Sobradinho I", monitores: 2 },
  { local: 'UPA "Setor O"', monitores: 1 },
  { local: "UPA da Ceilândia", monitores: 1 },
  { local: "UPA de Samambaia", monitores: 1 },
  { local: "UPA de São Sebastião", monitores: 1 },
  { local: "UPA de Sobradinho II", monitores: 1 },
  { local: "UPA do Gama", monitores: 1 },
  { local: "UPA do Recanto das Emas", monitores: 1 },
  { local: "UPA do Riacho Fundo II", monitores: 1 },
  { local: "UPA de Planaltina", monitores: 1 },
  { local: "UPA de Vicente Pires", monitores: 1 },
  { local: "UPA de Brazlândia", monitores: 1 },
  { local: "Metrô Praça do Relógio", monitores: 1 },
  { local: "Metrô Estação Central", monitores: 2 },
  { local: "Metrô Estação Águas Claras", monitores: 1 },
  { local: "Metrô Estação Arniqueiras", monitores: 1 },
  { local: "Metrô Estação Shopping", monitores: 1 },
  { local: "Terminal do BRT de Santa Maria (LED)", monitores: 2 },
  { local: "Terminal do BRT do Gama (LED)", monitores: 2 },
] as const;
// Fonte: Media Kit p.28 — "Monitores e Painéis LED". Soma = 39 telas em 27 locais,
// idêntico a ledNetwork.screens/locations (mobtv-data.ts) — dado reconciliado.
