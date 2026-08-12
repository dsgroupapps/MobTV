/**
 * Locais da rede MOBTV, enriquecidos com o rate card 2026 (`rate-card-2026.ts`)
 * onde foi possível associar o nome do local com segurança.
 *
 * A lista de locais em si (nomes e categorias) vem do que já existia no
 * projeto (antigo `Points.tsx`). O que este arquivo adiciona é a camada
 * comercial — telas, formato, preço por inserção, CPE do WiFi Ads, fluxo
 * mensal e impactos auditados — associada ponto a ponto, manualmente, com
 * a mesma tabela de preços 2026 usada pelo Explorador de Ativos.
 *
 * REGRA seguida na associação: só recebeu dado comercial o local cujo nome
 * bate com uma entrada do rate card, no máximo normalizando acento/maiúscula
 * e removendo um artigo (da/de/do) ou parêntese — nunca inferindo por
 * proximidade geográfica ou "provavelmente é o mesmo lugar". Onde o Media
 * Kit nomeia o mesmo tipo de local de forma diferente em tabelas diferentes
 * (ex.: "Terminal BRT Gama" na tabela de preços DOOH vs. "BRT do Gama" na
 * tabela de WiFi Ads) e não há ambiguidade possível dentro da categoria
 * (só existe um terminal de Gama), o comentário ao lado do ponto documenta
 * essa reconciliação explicitamente. Onde havia mais de um candidato
 * possível (ex. duas feiras de Samambaia) ou nomes genuinamente diferentes,
 * o campo comercial foi deixado de fora — cada ponto sem dado comercial
 * simplesmente não tem `produtos`/`valorPorCpe`/etc., sem comentário
 * adicional quando o motivo é só "não está em nenhuma tabela do rate card".
 *
 * `connectivity` (dual = DOOH+WiFi, wifi = só WiFi Social) é a mesma
 * classificação por categoria já usada no projeto, sourced na "Atuação
 * Diversificada" do Media Kit (p.28/33) — não foi alterada por este arquivo.
 */

export type Connectivity = "dual" | "wifi";

export type CategoryKey =
  "metro" | "terminais" | "upas" | "hospitais" | "feiras" | "restaurantes" | "servicos";

/** Um formato de mídia DOOH disponível no ponto (pode haver mais de um por local). */
export type DoohProduct = {
  tipo: string;
  telas: number;
  /** Ausente quando o inventário confirma a tela mas a tabela de preços não lista o ponto. */
  custoInsercao15s?: number;
  custoInsercao30s?: number;
};

export type NetworkPoint = {
  nome: string;
  /** Formatos DOOH com preço — ausente quando o rate card não lista o ponto. */
  produtos?: DoohProduct[];
  /** WiFi Ads — custo por engajamento (CPE), quando o ponto está na lista de WiFi Ads. */
  valorPorCpe?: number;
  /** Fluxo mensal de passageiros — só existe para as 5 estações de Metrô com painel de LED. */
  fluxoMensal?: number;
  /** Impactos auditados/mês (Datavisiooh, 2024) — só nos pontos com entrada individual na auditoria. */
  impactosAuditadosMes?: number;
  /**
   * Fotos reais do ponto. Vazio por padrão — ninguém aqui recebe foto
   * genérica de outro local. Preencher manualmente conforme o acervo for
   * reconstruído, ex.: images: ["/estacao_aguas.jpg"].
   */
  images?: string[];
};

export type Category = {
  key: CategoryKey;
  label: string;
  connectivity: Connectivity;
  points: NetworkPoint[];
};

/**
 * Taxonomia de mídia exibida ao anunciante — mais específica que o rótulo
 * comercial amplo "DOOH". Derivada diretamente do `tipo` de cada produto
 * (que já vem do rate card: strings como 'Monitor 49"' vs "LED 2x1m") e da
 * presença de `valorPorCpe` — não é um campo novo armazenado, é calculada a
 * partir do mesmo dado já sourced do Media Kit, então não há como divergir.
 */
export type MediaTypeKey = "screen" | "led" | "wifi";

export function pointMediaTypes(point: NetworkPoint): MediaTypeKey[] {
  const types: MediaTypeKey[] = [];
  if (point.produtos?.some((p) => p.tipo.includes("Monitor"))) types.push("screen");
  if (point.produtos?.some((p) => p.tipo.includes("LED"))) types.push("led");
  if (point.valorPorCpe != null) types.push("wifi");
  return types;
}

const WIFI_CPE = 8.0; // valor único do rate card (Media Kit p.62) — mesmo para todos os pontos WiFi Ads

export const networkPoints: Category[] = [
  {
    key: "metro",
    label: "Estações de Metrô",
    connectivity: "dual",
    points: [
      {
        nome: "Estação Central (Plano Piloto)",
        // rate-card-2026 tem 2 painéis para "Estação Central" (entrada+saída),
        // mesmo fluxo mensal reportado nos dois — não somado.
        produtos: [{ tipo: "LED 4x1,2m / 3x1,2m", telas: 2, custoInsercao15s: 4.9 }],
        valorPorCpe: WIFI_CPE,
        fluxoMensal: 478_000,
        images: ["/central_rodoviaria.jpg", "/central_rodoviaria2.jpg"],
      },
      {
        nome: "Estação Shopping",
        produtos: [{ tipo: "LED 3x2m", telas: 1, custoInsercao15s: 3.2 }],
        valorPorCpe: WIFI_CPE,
        fluxoMensal: 263_000,
        // Auditoria (p.39) lista "Metrô Shopping" — mesmo painel, nome abreviado.
        impactosAuditadosMes: 732_239,
        images: ["/estacao_shopping.jpg"],
      },
      { nome: "Estação Feira", valorPorCpe: WIFI_CPE, images: ["/estacao_metro_feira_guara.jpg"] },
      { nome: "Estação Guará", valorPorCpe: WIFI_CPE, images: ["/estacao_metro_guara.png"] },
      {
        nome: "Estação Ceilândia Centro",
        valorPorCpe: WIFI_CPE,
        images: ["/estacao_metro_ceilandia_centro.png"],
      },
      { nome: "Estação Ceilândia Sul", valorPorCpe: WIFI_CPE },
      { nome: "Estação Ceilândia Norte", valorPorCpe: WIFI_CPE },
      { nome: "Estação Guariroba", valorPorCpe: WIFI_CPE },
      {
        nome: "Estação Águas Claras",
        produtos: [{ tipo: "LED 3x1m", telas: 1, custoInsercao15s: 3.2 }],
        valorPorCpe: WIFI_CPE,
        fluxoMensal: 269_000,
        // Auditoria (p.39): "Metrô Águas Claras".
        impactosAuditadosMes: 1_000_000,
        images: ["/estacao_aguas.jpg"],
      },
      {
        nome: "Estação Arniqueiras",
        produtos: [{ tipo: "LED 3x1m", telas: 1, custoInsercao15s: 3.2 }],
        valorPorCpe: WIFI_CPE,
        fluxoMensal: 275_000,
        // Auditoria (p.39): "Metrô Arniqueiras".
        impactosAuditadosMes: 1_128_365,
        images: ["/estacao_arniqueiras.jpg"],
      },
      {
        nome: "Estação Praça do Relógio",
        produtos: [{ tipo: "LED 2,2x3m", telas: 1, custoInsercao15s: 3.2 }],
        valorPorCpe: WIFI_CPE,
        fluxoMensal: 204_000,
        // Auditoria (p.39): "Metrô Praça do Relógio".
        impactosAuditadosMes: 1_063_504,
        images: ["/estacao_praca.jpg"],
      },
    ],
  },
  {
    key: "terminais",
    label: "Terminais Rodoviários",
    connectivity: "dual",
    points: [
      { nome: "Rodoviária do Plano Piloto" },
      { nome: "Rodoviária de Sobradinho" },
      {
        nome: "Terminal BRT Santa Maria",
        // Tabela DOOH (p.60) tem 2 linhas para este terminal: painéis de LED e
        // monitores. Tabela WiFi Ads (p.62) chama o mesmo terminal de "Terminal
        // de Santa Maria" — único terminal de Santa Maria no Media Kit, sem
        // ambiguidade dentro da categoria.
        produtos: [
          { tipo: "LED 2x1m", telas: 3, custoInsercao15s: 3.2, custoInsercao30s: 5.81 },
          { tipo: 'Monitor 49"', telas: 2, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/brt_santamaria.jpg"],
      },
      {
        nome: "Terminal BRT Gama",
        // Mesma reconciliação: WiFi Ads (p.62) chama de "BRT do Gama".
        produtos: [
          { tipo: "LED 2x1m", telas: 3, custoInsercao15s: 3.2, custoInsercao30s: 5.81 },
          { tipo: 'Monitor 49"', telas: 2, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/brt_gama.jpg"],
      },
      {
        nome: 'Terminal Setor "O"',
        produtos: [
          { tipo: 'Monitor 49"', telas: 3, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/terminal_setor_o.jpg"],
      },
      {
        nome: "Terminal Interestadual de Brasília",
        images: ["/terminal_interestadual_bsb"],
      },
    ],
  },
  {
    key: "upas",
    label: "UPAs",
    connectivity: "dual",
    points: [
      {
        nome: "UPA Ceilândia",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
      },
      {
        nome: "UPA Samambaia",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_samambaia.png"],
      },
      {
        nome: "UPA São Sebastião",
        // Só na tabela DOOH — não aparece na lista de WiFi Ads (p.62).
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        images: ["/upa_sao_sebatiao.png"],
      },
      {
        nome: "UPA Sobradinho II",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
      },
      {
        nome: "UPA Gama",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_gama.jpg"],
      },
      {
        nome: "UPA Recanto das Emas",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_recanto_emas.webp"],
      },
      {
        nome: "UPA Riacho Fundo II",
        // Rate card diz só "UPA Riacho Fundo" (sem "II") nas duas tabelas —
        // única UPA de Riacho Fundo no Media Kit.
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_riachofundo.jpg", "/upa_riacho_2.jpg"],
      },
      {
        nome: "UPA Planaltina",
        // Tabela DOOH diz "UPA Rajadinha Planaltina" (bairro dentro de
        // Planaltina); WiFi Ads e inventário de LED dizem só "UPA Planaltina".
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_planaltina.jpg"],
      },
      {
        nome: "UPA Vicente Pires",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_vicentepires.jpg"],
      },
      {
        nome: "UPA Brazlândia",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_brazlandia.jpeg"],
      },
      {
        nome: "UPA Ceilândia Setor O",
        // Inventário de LED (p.28) confirma 1 monitor em 'UPA "Setor O"', mas
        // a tabela de preços DOOH (p.60) não tem linha própria para ela — por
        // isso aparece a tela, mas não o preço por inserção.
        produtos: [{ tipo: 'Monitor 49"', telas: 1 }],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_ceilandia_ii_setor_o.png"],
      },
    ],
  },
  {
    key: "hospitais",
    label: "Hospitais",
    connectivity: "dual",
    points: [
      {
        nome: "Hospital Regional de Taguatinga",
        produtos: [
          { tipo: 'Monitor 49"', telas: 2, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/hospital_regional_taguatinga.png"],
      },
      {
        nome: "Hospital Regional de Ceilândia",
        produtos: [
          { tipo: 'Monitor 49"', telas: 2, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/hospital_regional_ceilandia.jpeg"],
      },
      {
        nome: "Hospital Regional do Gama",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/hospital_regional_gama.png"],
      },
      { nome: "Hospital Regional de Sobradinho" },
      {
        nome: "Hospital Regional de Santa Maria",
        produtos: [
          { tipo: 'Monitor 49"', telas: 2, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
      },
    ],
  },
  {
    key: "feiras",
    label: "Feiras",
    connectivity: "dual",
    points: [
      {
        nome: "Feira do Guará",
        produtos: [
          { tipo: 'Monitor 49"', telas: 2, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/feira_guara.png"],
      },
      { nome: "Feira dos Goianos", valorPorCpe: WIFI_CPE, images: ["/feira_goianos.jpg"] },
      { nome: "Feira Azul do Gama", images: ["/feira_azul_gama.png"] },
      {
        nome: "Feira Modelo de Sobradinho I",
        valorPorCpe: WIFI_CPE,
        images: ["/feira_modelo.jpeg", "/feira_sobradinho1.jpg"],
      },
      {
        nome: "Feira da Ceilândia",
        valorPorCpe: WIFI_CPE,
        images: ["/feira_central_ceilandia.jpeg"],
      },
      { nome: "Shopping Popular Ceilândia", images: ["/shopping_popular_ceilandia.jpeg"] },
      // "Feira de Samambaia": a tabela de WiFi Ads lista DUAS feiras de
      // Samambaia ("Feira Samambaia" e "Feira Samambaia 2") — sem forma segura
      // de saber qual das duas é esta, o CPE não foi associado.
      { nome: "Feira de Samambaia" },
    ],
  },
  {
    key: "restaurantes",
    label: "Restaurantes Comunitários",
    connectivity: "wifi",
    // O rate card não tem uma categoria própria para Restaurantes Comunitários
    // — nenhum destes 6 pontos tem preço/CPE individual documentado.
    points: [
      { nome: "Brazlândia", images: ["/restaurante_comunitario_braslandia.webp"] },
      { nome: "Sobradinho II" },
      { nome: "Ceilândia" },
      { nome: "São Sebastião" },
      { nome: "Gama", images: ["/restaurante_comunitario_gama.jpg"] },
      { nome: "Recanto", images: ["/restaurante_comunitario_recanto.jpg"] },
    ],
  },
  {
    key: "servicos",
    label: "Serviços",
    connectivity: "wifi",
    points: [
      { nome: "Na Hora Ceilândia", valorPorCpe: WIFI_CPE, images: ["/na_hora_ceilandia.jpg"] },
      { nome: "Na Hora Taguatinga", valorPorCpe: WIFI_CPE, images: ["/na_hora_taguatinga.jpg"] },
      {
        nome: "Na Hora Rodoviária Plano Piloto",
        valorPorCpe: WIFI_CPE,
        images: ["/na_hora_rodoviaria_plano.png"],
      },
      { nome: "Na Hora Gama", valorPorCpe: WIFI_CPE },
      { nome: "Na Hora Brazlândia" },
      { nome: "Na Hora Sobradinho", valorPorCpe: WIFI_CPE },
      { nome: "Biblioteca da Ceilândia", images: ["/biblioteca_ceilandia.webp"] },
    ],
  },
];
