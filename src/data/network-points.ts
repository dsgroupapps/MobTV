/**
 * Locais da rede MOBTV, enriquecidos com o rate card 2026 (`rate-card-2026.ts`)
 * onde foi possível associar o nome do local com segurança.
 *
 * REGRA DEFINITIVA DE ACERVO (reauditoria completa, substitui critérios
 * anteriores): a existência de um ponto e o tipo de mídia que ele exibe
 * (Tela / Painel LED / WiFi Ads) são determinados EXCLUSIVAMENTE por dois
 * inventários nominais do Media Kit:
 *
 *   - p.28 "Monitores e Painéis LED"  → confirma Tela (monitor) e/ou Painel LED
 *   - p.52 "Wifi ADS — Locais com Wifi da MOBTV" → confirma WiFi Ads
 *
 * Um ponto só existe no catálogo se aparecer nominalmente em pelo menos uma
 * das duas páginas. Categoria genérica, ícone de mapa, foto em public/ ou
 * presença no site antigo NUNCA justificam manter um ponto — só a
 * página 28 e/ou 52. Preço, fluxo e impacto auditado continuam vindo de
 * outras tabelas do Media Kit (p.39, p.60-62), associados apenas quando há
 * correspondência inequívoca com um ponto já confirmado por p.28/p.52.
 *
 * Normalização permitida ao cruzar as duas listas: acento/maiúscula, artigo
 * (da/de/do), parêntese, e variações óbvias de escrita da mesma entidade
 * (ex.: "UPA da Ceilândia" = "UPA Ceilândia"; "Metrô Estação Central" =
 * "Estação Central"; "Terminal Rodoviário de Sobradinho I" = "Rodoviária de
 * Sobradinho"). Nomes genuinamente diferentes (ex.: "Feira de Samambaia" vs.
 * "Feira Samambaia 2") são tratados como pontos distintos, nunca fundidos.
 *
 * Nesta reauditoria, comparado ao levantamento anterior (que usava a tabela
 * de preços p.60-62 e páginas de fluxo como fonte de existência):
 *   - REMOVIDOS por não constarem em p.28 nem p.52: Terminal Interestadual de
 *     Brasília; os 6 Restaurantes Comunitários; Biblioteca da Ceilândia.
 *   - ADICIONADO: Feira Samambaia 2 (p.52, item 14 — distinta de "Feira de
 *     Samambaia", item 13; ver investigação no comentário do ponto).
 *   - CORRIGIDOS (existiam, badge errada): Estação Águas Claras e Estação
 *     Arniqueiras perdem WiFi Ads (não estão nas 8 estações de metrô da p.52);
 *     Rodoviária do Plano Piloto, Hospital Regional de Sobradinho, Feira de
 *     Samambaia e Na Hora Brazlândia ganham WiFi Ads (estão na p.52 e não
 *     tinham sido associados antes).
 *
 * `connectivity` (dual = DOOH+WiFi, wifi = só WiFi Social) é a mesma
 * classificação por categoria já usada no projeto — não alterada aqui.
 */

export type Connectivity = "dual" | "wifi";

export type CategoryKey = "metro" | "terminais" | "upas" | "hospitais" | "feiras" | "servicos";

/** Um formato de mídia DOOH disponível no ponto (pode haver mais de um por local). */
export type DoohProduct = {
  tipo: string;
  telas: number;
  /** Ausente quando o inventário confirma a tela mas a tabela de preços não lista o ponto. */
  custoInsercao15s?: number;
  custoInsercao30s?: number;
};

/**
 * Localização real do ponto no Google Maps. `lat`/`lng` vêm do marcador
 * exato (par `!3d..!4d..` do link resolvido), não do centro de viewport
 * (`@lat,lng` pode ser um enquadramento mais largo/deslocado). `mapsUrl` é o
 * link de compartilhamento original (maps.app.goo.gl) fornecido pela MOBTV —
 * mantido como está para o CTA "Ver no Google Maps", nunca substituído pela
 * URL longa resolvida.
 */
export type PointLocation = {
  lat: number;
  lng: number;
  mapsUrl: string;
};

export type NetworkPoint = {
  nome: string;
  /** Formatos DOOH com preço — ausente quando o rate card não lista o ponto. */
  produtos?: DoohProduct[];
  /** WiFi Ads — custo por engajamento (CPE), quando o ponto está na lista de WiFi Ads (p.52). */
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
  /**
   * Localização no Google Maps. Ausente = ainda não recebeu link da MOBTV
   * (não inferir por nome — pontos sem este campo simplesmente não mostram
   * bloco de mapa). Primeiro lote associado em 2026-08; demais pontos
   * recebem em lotes futuros.
   */
  location?: PointLocation;
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
        // p.28: "Metrô Estação Central — 2 Painéis de LED". p.52 item 1: WiFi.
        // rate-card-2026 tem 2 painéis para "Estação Central" (entrada+saída),
        // mesmo fluxo mensal reportado nos dois — não somado.
        produtos: [{ tipo: "LED 4x1,2m / 3x1,2m", telas: 2, custoInsercao15s: 4.9 }],
        valorPorCpe: WIFI_CPE,
        fluxoMensal: 478_000,
        // Auditoria (p.39) tem 2 linhas para Central (Entrada 1.025.704 + Escada
        // 1.141.956) — painéis distintos, cada um gera impacto próprio, por isso
        // somados aqui (diferente do fluxoMensal acima, que é o mesmo fluxo de
        // passageiros relatado nos dois painéis, não duas contagens aditivas).
        impactosAuditadosMes: 2_167_660,
        images: ["/central_rodoviaria.jpg", "/central_rodoviaria2.jpg"],
        location: {
          lat: -15.7936771,
          lng: -47.8834736,
          mapsUrl: "https://maps.app.goo.gl/WFqFmBbCcHb6SeYU8",
        },
      },
      {
        nome: "Estação Shopping",
        // p.28: "Metrô Estação Shopping — 1 Painel de LED". p.52 item 2: WiFi.
        produtos: [{ tipo: "LED 3x2m", telas: 1, custoInsercao15s: 3.2 }],
        valorPorCpe: WIFI_CPE,
        fluxoMensal: 263_000,
        // Auditoria (p.39) lista "Metrô Shopping" — mesmo painel, nome abreviado.
        impactosAuditadosMes: 732_239,
        images: ["/estacao_shopping.jpg"],
        location: {
          lat: -15.83242,
          lng: -47.95069,
          mapsUrl: "https://maps.app.goo.gl/PVgnTy35Ei33LPo58",
        },
      },
      {
        // p.52 item 4: "Estação Feira do Guará Metrô/DF" — estação de metrô,
        // não confundir com o ponto "Feira do Guará" (categoria Feiras).
        // Não aparece em p.28 (sem LED/monitor confirmado).
        nome: "Estação Feira",
        valorPorCpe: WIFI_CPE,
        images: ["/estacao_metro_feira_guara.jpg"],
        location: {
          lat: -15.8230865,
          lng: -47.9750484,
          mapsUrl: "https://maps.app.goo.gl/EBV61F5C7ckzmkuGA",
        },
      },
      {
        nome: "Estação Guará",
        valorPorCpe: WIFI_CPE,
        images: ["/estacao_metro_guara.png"],
        location: {
          lat: -15.8262757,
          lng: -47.9828693,
          mapsUrl: "https://maps.app.goo.gl/2Cizd26467QBvVp18",
        },
      }, // p.52 item 3.
      {
        nome: "Estação Ceilândia Centro",
        valorPorCpe: WIFI_CPE,
        images: ["/estacao_metro_ceilandia_centro.png"],
        location: {
          lat: -15.82217,
          lng: -48.11211,
          mapsUrl: "https://maps.app.goo.gl/udKXViCx71mfbhAQ9",
        },
      }, // p.52 item 5.
      {
        nome: "Estação Ceilândia Sul",
        valorPorCpe: WIFI_CPE,
        images: ["/estacao_ceilandia_sul.png"],
        location: {
          lat: -15.83778,
          lng: -48.10329,
          mapsUrl: "https://maps.app.goo.gl/bPkx1GNoYWothZuF7",
        },
      }, // p.52 item 6.
      {
        nome: "Estação Ceilândia Norte",
        valorPorCpe: WIFI_CPE,
        images: ["/estacao_ceilandia_norte.webp"],
        location: {
          lat: -15.81486,
          lng: -48.11612,
          mapsUrl: "https://maps.app.goo.gl/FeSs3qABp5vDxVZ46",
        },
      }, // p.52 item 7.
      {
        nome: "Estação Guariroba",
        valorPorCpe: WIFI_CPE,
        images: ["/estacao_guariroba.jpg"],
        location: {
          lat: -15.83049,
          lng: -48.10736,
          mapsUrl: "https://maps.app.goo.gl/2SceAgEizChQSbUe7",
        },
      }, // p.52 item 8.
      {
        nome: "Estação Águas Claras",
        // p.28: "Metrô Estação Águas Claras — 1 Painel de LED". NÃO está entre
        // as 8 estações de metrô da p.52 — sem valorPorCpe (removido nesta
        // reauditoria; a versão anterior herdava WiFi de uma tabela de preços
        // que não é mais a fonte de existência/mídia).
        produtos: [{ tipo: "LED 3x1m", telas: 1, custoInsercao15s: 3.2 }],
        fluxoMensal: 269_000,
        // Auditoria (p.39): "Metrô Águas Claras".
        impactosAuditadosMes: 1_000_000,
        images: ["/estacao_aguas.jpg"],
        location: {
          lat: -15.84004,
          lng: -48.02847,
          mapsUrl: "https://maps.app.goo.gl/SSeDuBENcj8yYjnZ7",
        },
      },
      {
        nome: "Estação Arniqueiras",
        // p.28: "Metrô Estação Arniqueiras — 1 Painel de LED". Mesma situação
        // de Águas Claras: não está na p.52, sem valorPorCpe.
        produtos: [{ tipo: "LED 3x1m", telas: 1, custoInsercao15s: 3.2 }],
        fluxoMensal: 275_000,
        // Auditoria (p.39): "Metrô Arniqueiras".
        impactosAuditadosMes: 1_128_365,
        images: ["/estacao_arniqueiras.jpg"],
        location: {
          lat: -15.8367377,
          lng: -48.0170554,
          mapsUrl: "https://maps.app.goo.gl/GjkTQf7YQ3gUN5Kw9",
        },
      },
      {
        nome: "Estação Praça do Relógio",
        // p.28: "Metrô Praça do Relógio — 1 Painel de LED". Não está na p.52
        // (que lista só 8 das 11 estações de metrô) — sem valorPorCpe.
        produtos: [{ tipo: "LED 2,2x3m", telas: 1, custoInsercao15s: 3.2 }],
        fluxoMensal: 204_000,
        // Auditoria (p.39): "Metrô Praça do Relógio".
        impactosAuditadosMes: 1_063_504,
        images: ["/estacao_praca.jpg"],
        location: {
          lat: -15.83323,
          lng: -48.05658,
          mapsUrl: "https://maps.app.goo.gl/UoDHhAnPFMJyKyBw8",
        },
      },
    ],
  },
  {
    key: "terminais",
    label: "Terminais Rodoviários",
    connectivity: "dual",
    points: [
      {
        // p.52 item 26: "Rodoviária do Plano Piloto" — nome idêntico, sem
        // ambiguidade. Não está em p.28 (sem Tela/LED confirmado).
        nome: "Rodoviária do Plano Piloto",
        valorPorCpe: WIFI_CPE,
        images: ["/rodoviaria_plano_piloto.webp"],
        location: {
          lat: -15.79332,
          lng: -47.88285,
          mapsUrl: "https://maps.app.goo.gl/JgdQAqjqM7pktFA87",
        },
      },
      {
        nome: "Rodoviária de Sobradinho",
        // p.28 item 9 e p.52 item 27 usam o mesmo nome, "Terminal Rodoviário
        // de Sobradinho I" — único terminal de Sobradinho no Media Kit, sem
        // ambiguidade. p.28: 2 monitores (sem preço de inserção publicado,
        // mesmo padrão da UPA Ceilândia Setor O). p.52: WiFi Ads.
        produtos: [{ tipo: 'Monitor 49"', telas: 2 }],
        valorPorCpe: WIFI_CPE,
        images: ["/rodoviaria_sobradinho.webp"],
        location: {
          lat: -15.6495275,
          lng: -47.7858407,
          mapsUrl: "https://maps.app.goo.gl/npuaJqJG5FPU8UWK8",
        },
      },
      {
        nome: "Terminal BRT Santa Maria",
        // p.28 itens 6+26 ("Terminal do BRT de Santa Maria"): 2 monitores + 2
        // painéis de LED. p.52 item 28 ("Terminal BRT Santa Maria"): WiFi.
        // Tabela de preços (p.60) diz 3 painéis de LED aqui — diverge do
        // inventário nominal (p.28) e das fotos numeradas dos painéis (p.31),
        // que mostram só 2. Mantido 3 por seguir a tabela de preços para o
        // valor comercial; divergência entre páginas do próprio Media Kit,
        // não resolvida pela MOBTV.
        produtos: [
          { tipo: "LED 2x1m", telas: 3, custoInsercao15s: 3.2, custoInsercao30s: 5.81 },
          { tipo: 'Monitor 49"', telas: 2, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        // Auditoria (p.39): "BRT Santa Maria 1" 2.985.180 + "BRT Santa Maria 2"
        // 760.420 — 2 painéis distintos, somados (mesmo critério do impacto de
        // Estação Central).
        impactosAuditadosMes: 3_745_600,
        images: ["/brt_santamaria.jpg"],
        location: {
          lat: -16.0024084,
          lng: -47.9863856,
          mapsUrl: "https://maps.app.goo.gl/JdjyZFg6w6ZuNp888",
        },
      },
      {
        nome: "Terminal BRT Gama",
        // p.28 itens 7+27 ("Terminal do BRT do Gama"): 2 monitores + 2 painéis
        // de LED. p.52 item 30 ("Terminal BRT Gama"): WiFi. Mesma nota de
        // divergência 2 vs 3 painéis de LED entre p.28/31 e p.60 — mantido 3.
        produtos: [
          { tipo: "LED 2x1m", telas: 3, custoInsercao15s: 3.2, custoInsercao30s: 5.81 },
          { tipo: 'Monitor 49"', telas: 2, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        // Auditoria (p.39): "BRT Gama 1" 789.953 + "BRT Gama 2" 1.359.220.
        impactosAuditadosMes: 2_149_173,
        images: ["/brt_gama.jpg"],
        location: {
          lat: -15.9911124,
          lng: -48.0486122,
          mapsUrl: "https://maps.app.goo.gl/eQHdTTR4QZVSvAiB6",
        },
      },
      {
        // p.28 item 8 e p.52 item 29 usam o mesmo nome, 'Terminal do "Setor
        // O"' — 3 monitores (p.28) + WiFi (p.52).
        nome: 'Terminal Setor "O"',
        produtos: [
          { tipo: 'Monitor 49"', telas: 3, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/terminal_setor_o.jpg"],
        location: {
          lat: -15.788155,
          lng: -48.1343624,
          mapsUrl: "https://maps.app.goo.gl/amHD6CKYhvpdG7veA",
        },
      },
      // REMOVIDO nesta reauditoria: "Terminal Interestadual de Brasília" não
      // aparece em p.28 nem em p.52. A versão anterior do dataset associava
      // WiFi Ads a este ponto via "Rodoviária Interestadual" (tabela de
      // preços p.62), mas essa tabela deixou de ser a fonte de existência —
      // sem suporte nominal nas duas páginas de referência, o ponto foi
      // removido do catálogo. Imagem /terminal_interestadual_brasilia.jpg
      // removida de public/ junto com a entrada.
    ],
  },
  {
    key: "upas",
    label: "UPAs",
    connectivity: "dual",
    points: [
      {
        // p.28 item 11: "UPA da Ceilândia". p.52 item 39: "UPA Ceilândia".
        nome: "UPA Ceilândia",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_ceilandia.jpeg"],
        location: {
          lat: -15.8252198,
          lng: -48.1211193,
          mapsUrl: "https://maps.app.goo.gl/XL1x5tf8Y8KR7Nc1A",
        },
      },
      {
        nome: "UPA Samambaia",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_samambaia.png"],
        location: {
          lat: -15.8831403,
          lng: -48.1001431,
          mapsUrl: "https://maps.app.goo.gl/Vzd4WYxnjBWnGgkr7",
        },
      },
      {
        nome: "UPA São Sebastião",
        // p.28 item 13: "UPA de São Sebastião". Não está na p.52 (40 itens) —
        // sem valorPorCpe.
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        images: ["/upa_sao_sebatiao.png"],
        location: {
          lat: -15.900964,
          lng: -47.7775948,
          mapsUrl: "https://maps.app.goo.gl/R15yXaUmg6oGK3HV7",
        },
      },
      {
        nome: "UPA Sobradinho II",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_sobradinho_2.jpg"],
        // O link fornecido para "UPA Sobradinho II" resolve para "UBS 1 -
        // Sobradinho II" no Google Maps (não "UPA"). Mantido conforme
        // fornecido — sinalizado para confirmação da MOBTV no relatório.
        location: {
          lat: -15.6444224,
          lng: -47.8245796,
          mapsUrl: "https://maps.app.goo.gl/yA4fPe9t8ZjTDNGL7",
        },
      },
      {
        nome: "UPA Gama",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_gama.jpg"],
        location: {
          lat: -16.014989,
          lng: -48.054164,
          mapsUrl: "https://maps.app.goo.gl/EpkpPh9aeZXbFurk6",
        },
      },
      {
        nome: "UPA Recanto das Emas",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_recanto_emas.webp"],
        location: {
          lat: -15.9117906,
          lng: -48.0574363,
          mapsUrl: "https://maps.app.goo.gl/SGu8PPZHtFZpAZvf7",
        },
      },
      {
        nome: "UPA Riacho Fundo II",
        // p.28 item 17: "UPA do Riacho Fundo II". p.52 item 40: "UPA Riacho
        // Fundo" (sem "II") — única UPA de Riacho Fundo no Media Kit, sem
        // ambiguidade.
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_riachofundo.jpg", "/upa_riacho_2.jpg"],
        location: {
          lat: -15.8999409,
          lng: -48.04013,
          mapsUrl: "https://maps.app.goo.gl/LyxxhLkPzcoxUhru8",
        },
      },
      {
        nome: "UPA Planaltina",
        // p.28 item 18: "UPA de Planaltina". p.52 item 36: "UPA Planaltina".
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_planaltina.jpg"],
        location: {
          lat: -15.4511472,
          lng: -47.6163573,
          mapsUrl: "https://maps.app.goo.gl/BbxieqCq1wwbXXvi9",
        },
      },
      {
        nome: "UPA Vicente Pires",
        produtos: [
          { tipo: 'Monitor 49"', telas: 1, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/upa_vicentepires.jpg"],
        location: {
          lat: -15.7964967,
          lng: -48.0245302,
          mapsUrl: "https://maps.app.goo.gl/hNWk3PxFW3CpKJ1YA",
        },
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
        // p.28 item 10: 'UPA Setor "O"' — 1 monitor, sem preço de inserção
        // publicado em nenhuma tabela. p.52 item 31: 'UPA Ceilândia II "Setor
        // O"' — WiFi.
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
      {
        nome: "Hospital Regional de Sobradinho",
        // Não está em p.28 (sem Tela confirmada). p.52 item 18: "Hospital
        // Regional Sobradinho" — WiFi Ads adicionado nesta reauditoria (a
        // versão anterior deixava sem preço por seguir só a tabela de preços
        // p.62, que não lista Sobradinho entre os 4 hospitais — mas a p.52 é
        // agora a fonte de existência/mídia, e ela confirma).
        valorPorCpe: WIFI_CPE,
        images: ["/hospital_regional_sobradinho.jpg"],
      },
      {
        nome: "Hospital Regional de Santa Maria",
        produtos: [
          { tipo: 'Monitor 49"', telas: 2, custoInsercao15s: 1.9, custoInsercao30s: 3.32 },
        ],
        valorPorCpe: WIFI_CPE,
        images: ["/hospital_regional_santa_maria.jpg"],
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
      {
        nome: "Feira Modelo de Sobradinho I",
        valorPorCpe: WIFI_CPE,
        images: ["/feira_modelo.jpeg", "/feira_sobradinho1.jpg"],
      },
      {
        // p.52 item 9: "Feira Central da Ceilândia".
        nome: "Feira da Ceilândia",
        valorPorCpe: WIFI_CPE,
        images: ["/feira_central_ceilandia.jpeg"],
      },
      {
        // INVESTIGAÇÃO "Feira de Samambaia" vs "Feira Samambaia 2" (pedida
        // explicitamente): a p.52 lista as duas como itens numerados
        // distintos (13 e 14), no mesmo padrão usado para todo par de locais
        // genuinamente diferentes na página (ex.: "UPA Ceilândia II Setor O"
        // vs "UPA Ceilândia", itens 31 e 39). Não há nenhuma nota, asterisco
        // ou referência cruzada em nenhuma das 63 páginas do Media Kit
        // sugerindo que sejam o mesmo local com nomes diferentes — e
        // Samambaia é uma RA grande, plausível ter 2 feiras distintas. Tratado
        // como 2 pontos separados (ver "Feira Samambaia 2" abaixo). WiFi Ads
        // adicionado a este ponto (não tinha nenhuma mídia antes).
        nome: "Feira de Samambaia",
        valorPorCpe: WIFI_CPE,
        images: ["/feira_samambaia.webp"],
      },
      {
        // NOVO ponto (não existia no dataset). p.52 item 14: "Feira Samambaia
        // 2" — ver investigação no comentário de "Feira de Samambaia" acima.
        // Sem foto própria do local: usa a mesma foto genérica de feira
        // (senhora segurando celular com o WiFi Social DF) já usada no card
        // grande da categoria "Feiras" em Network.tsx (src/assets/network-
        // feiras.jpg, copiada para public/feira_samambaia_2.jpg) — não é uma
        // foto específica deste ponto, só reaproveita a mesma imagem genérica
        // já usada em outro lugar do site para a categoria.
        nome: "Feira Samambaia 2",
        valorPorCpe: WIFI_CPE,
        images: ["/feira_samambaia_2.jpg"],
      },
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
        // p.52 item 21: "Na Hora - Rodoviária Plano Piloto".
        nome: "Na Hora Rodoviária Plano Piloto",
        valorPorCpe: WIFI_CPE,
        images: ["/na_hora_rodoviaria_plano.png"],
      },
      { nome: "Na Hora Gama", valorPorCpe: WIFI_CPE, images: ["/nahora_gama.jpeg"] },
      {
        // p.52 item 24: "Na Hora - Brazlândia" — WiFi Ads adicionado nesta
        // reauditoria (a versão anterior deixava sem preço por seguir só a
        // tabela de preços p.62, que não lista Brazlândia entre as 5 unidades
        // de Na Hora — mas a p.52 confirma).
        nome: "Na Hora Brazlândia",
        valorPorCpe: WIFI_CPE,
        images: ["/nahora_brazlandia.jpg"],
      },
      {
        nome: "Na Hora Sobradinho",
        valorPorCpe: WIFI_CPE,
        images: ["/nahora_sobradinho.jpeg"],
      },
      // REMOVIDOS nesta reauditoria por não constarem em p.28 nem p.52:
      // categoria "Restaurantes Comunitários" inteira (6 pontos: Brazlândia,
      // Sobradinho II, Ceilândia, São Sebastião, Gama, Recanto) e "Biblioteca
      // da Ceilândia". Ambos só apareciam como ícone genérico no mapa de
      // cobertura, nunca nomeados individualmente em nenhuma das 63 páginas
      // do Media Kit — não atendem mais à regra de acervo. Imagens
      // correspondentes removidas de public/ junto com as entradas.
    ],
  },
];

/**
 * Total de pontos nomeados neste dataset — única fonte para qualquer texto do
 * tipo "X pontos" que descreva literalmente o catálogo abaixo (ex.: o
 * cabeçalho do Explorador de Ativos). Não confundir com `networkFootprint`
 * (mobtv-data.ts), que cita o número "53 pontos" impresso no mapa de
 * cobertura do Media Kit (p.33/47) — uma métrica agregada da MOBTV, não a
 * contagem de itens individualmente nomeados/detalhados aqui. Os dois números
 * podem divergir sem que isso seja um bug.
 */
export const totalPointsCount = networkPoints.reduce((sum, cat) => sum + cat.points.length, 0);
