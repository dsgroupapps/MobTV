import { findPointBySlug, type PointWithCategory } from "../lib/point-slug.ts";

/**
 * Dados de audiência/pesquisa comercial por ponto — camada ADITIVA e
 * separada de `network-points.ts`, de propósito. `network-points.ts`
 * continua sendo a fonte única de identidade (nome, slug, categoria, mídia,
 * fotos, localização); este arquivo nunca repete nenhum desses campos — só
 * guarda o que `network-points.ts` nunca teve: audiência, renda, demografia
 * e indicadores de pesquisa por ponto, associados pelo `slug` já congelado.
 *
 * FONTE: planilha `Tabela_Mestre_MOBTV_DF_REVISADA_FINAL.xlsx` (aba
 * "Tabela-Mestre REVISADA FINAL", 25 registros; aba "Legenda e
 * Atualizações" usada só para conferência de metodologia). A planilha é
 * material de entrada local — não faz parte do bundle, não é versionada
 * (ver .gitignore) e não é lida em runtime; os dados abaixo são a
 * transcrição tipada e definitiva dela.
 *
 * ESCOPO (25 de 44 pontos): esta camada só existe para pontos com Tela
 * (monitor) e/ou Painel LED em `network-points.ts` — são esses os locais
 * com QR Code físico apontando para /ponto/$slug. Pontos só-WiFi (sem
 * `produtos`) não recebem entrada aqui; o cálculo do conjunto elegível
 * (produtos.some(p => tipo inclui "Monitor" ou "LED")) bateu exatamente com
 * os 25 registros da planilha — ver `pointAudienceData.integrity.test.ts`.
 *
 * REGRA MÍDIA KIT: todo valor de `audited_impacts` vem do Mídia Kit oficial
 * da MOBTV (Datavision) — tratado sempre como fonte primária, sourceQuality
 * "A", nunca substituído nem rebaixado por divergência com outra fonte.
 *
 * MÚLTIPLAS MÉTRICAS: cada ponto pode ter mais de uma métrica de fluxo
 * simultânea (ex.: passageiros/mês E impactos/mês Datavision) — nunca
 * somadas nem convertidas entre si. `passengers`, `attendances` e
 * `procedures` são conceitos DIFERENTES (procedimento ≠ atendimento ≠
 * passageiro) e são preservados com o tipo original da planilha.
 *
 * N/D = dado não disponível, nunca convertido em 0 — os campos
 * correspondentes ficam simplesmente ausentes (`undefined`).
 *
 * ATUALIZAÇÃO FUTURA: para corrigir um número, edite o registro
 * correspondente em `pointAudienceData` abaixo (chave = slug). Nenhuma
 * rota, componente ou slug precisa mudar — a leitura é sempre via
 * `getPointAudienceData(slug)` / `getPointWithAudienceData(slug)`.
 */

/** Tipo de indicador de fluxo/audiência — nunca somar ou converter entre tipos distintos. */
export type MetricType =
  | "passengers"
  | "audited_impacts"
  | "attendances"
  | "procedures"
  | "outpatient_consultations"
  | "estimated_visitors";

/** Categoria de pesquisa usada na planilha (distinta de `CategoryKey` de network-points.ts, que é a taxonomia do catálogo público). */
export type ResearchCategory =
  | "Metrô"
  | "BRT"
  | "Terminal Rodoviário"
  | "UPA"
  | "Hospital"
  | "Feira";

/** Qualidade da fonte do dado em si (A = primária/oficial, B = imprensa/estimativa documentada, C = estimativa sem fonte). */
export type SourceQuality = "A" | "B" | "C";

/** Confiança histórica atribuída pela auditoria da pesquisa (A = mais confiável, E = menos). */
export type HistoricalConfidence = "A" | "B" | "C" | "D" | "E";

/** Prontidão de publicação: A = pronto para publicar, B = publicável com ressalva, C = estimativa. */
export type PublicationReadiness = "A" | "B" | "C";

/** Domiciliar, familiar e per capita são métricas DISTINTAS — nunca tratadas como equivalentes. */
export type IncomeType = "domiciliar" | "familiar" | "per_capita";

export type PointMetric = {
  type: MetricType;
  /** Valor MENSAL — convenção de `value`/`unit` em todo este arquivo. */
  value: number;
  /** Unidade padronizada (ex.: "passageiros/mês", "procedimentos/mês"). */
  unit: string;
  /** Texto original da célula "Fluxo mensal"/"Impactos/mês" da planilha, para auditoria. */
  raw: string;
  /** Ano/competência do dado, quando informado pela planilha. */
  period?: string;
  source: string;
  sourceQuality: SourceQuality;
  /** true quando a planilha marcou o valor como estimativa (coluna "Estimado"). */
  estimated: boolean;
  /**
   * Total ANUAL exato, quando a fonte é uma competência de ano completo
   * (ex.: painel InfoSaúde-DF/SIA-MS). `value` (mensal) é sempre derivado
   * deste número por `Math.round(annualValue / 12)` no próprio arquivo —
   * nunca um arredondamento manual digitado à parte.
   */
  annualValue?: number;
};

export type PointIncome = {
  value: number;
  type: IncomeType;
  /** Texto completo da coluna "Tipo de renda" (contexto/atribuição territorial, ano da fonte quando embutido). */
  typeLabel: string;
  /** Texto original da célula "Renda média". */
  raw: string;
  source: string;
  sourceQuality: SourceQuality;
};

export type GenderSplit = {
  femalePercent: number;
  malePercent: number;
};

export type PointDemographics = {
  averageAge?: number;
  gender?: GenderSplit;
};

export type PointAudienceData = {
  /** Mesmo slug congelado de network-points.ts — chave de associação, nunca gerado/alterado aqui. */
  slug: string;
  researchCategory: ResearchCategory;
  /** RA/localidade usada pela pesquisa como base da renda e demografia deste ponto (pode divergir do nome do ponto — ver notes). */
  referenceArea?: string;
  /** Uma ou mais métricas de fluxo/audiência simultâneas — nunca somadas entre tipos diferentes. */
  metrics: PointMetric[];
  income?: PointIncome;
  demographics?: PointDemographics;
  averageDwellTime?: string;
  targetAudience?: string;
  consumptionProfile?: string;
  publicationReadiness: PublicationReadiness;
  historicalConfidence: HistoricalConfidence;
  /** Texto integral da coluna "Observações" — inclui ressalvas de correspondência de nome, histórico de conflito de fontes e decisões de pesquisa. Preservado por completo, nunca resumido. */
  notes?: string;
};

/**
 * 25 registros — um por ponto elegível (Tela/LED) da planilha, indexados
 * pelo slug congelado de network-points.ts.
 */
export const pointAudienceData: Record<string, PointAudienceData> = {
  "estacao-central-plano-piloto": {
    slug: "estacao-central-plano-piloto",
    researchCategory: "Metrô",
    referenceArea: "Brasília (Plano Piloto)",
    metrics: [
      {
        type: "passengers",
        value: 500000,
        unit: "passageiros/mês",
        raw: "500.000 passageiros/mês (aprox., 'quase meio milhão')",
        period: "média mensal 2024 (divulgado em 20/01/2025)",
        source: "Agência Brasília / Metrô-DF",
        sourceQuality: "A",
        estimated: true,
      },
      {
        type: "audited_impacts",
        value: 2167660,
        unit: "impactos/mês",
        raw: "2.167.660 (impactos/mês (Datavision, soma de 2 painéis))",
        source: "Datavision / Mídia Kit MOBTV",
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 14894.5,
      type: "domiciliar",
      typeLabel:
        "domiciliar média (estimativa derivada — média simples entre Asa Sul e Asa Norte, proxy para o Plano Piloto central)",
      raw: "R$ 14.894,50 (domiciliar, estimativa derivada)",
      source:
        "Estimativa derivada — média simples entre a renda média domiciliar da Asa Sul (R$ 16.455,00) e da Asa Norte (R$ 13.334,00)",
      sourceQuality: "B",
    },
    demographics: {
      averageAge: 40.5,
      gender: { femalePercent: 54, malePercent: 46 },
    },
    averageDwellTime: "6 a 15 minutos (categoria Metrô/BRT, Mídia Kit MOBTV)",
    targetAudience:
      "Estudantes, trabalhadores e consumidores frequentes de serviços e varejo (categoria)",
    consumptionProfile: "Alimentação rápida, tecnologia, moda, serviços financeiros (categoria)",
    publicationReadiness: "B",
    historicalConfidence: "A",
    notes:
      "CORREÇÃO PONTUAL (renda): Estimativa calculada pela média simples entre a renda média domiciliar da Asa Sul (R$ 16.455,00) e da Asa Norte (R$ 13.334,00), utilizada como proxy para a região central do Plano Piloto — (16.455,00 + 13.334,00) ÷ 2 = R$ 14.894,50/mês. Decisão explícita do cliente, por instrução direta, substituindo o estado anterior 'N/D' (ver HISTÓRICO abaixo). Classificada como estimativa DERIVADA (sourceQuality B) — não é valor observado diretamente para a Estação Central, é uma proxy calculada a partir de dois valores de bairros vizinhos, mantendo o tipo domiciliar (as duas fontes de origem já são domiciliares, não misturadas com familiar/per capita). Indicador de audiência (passengers/audited_impacts) NÃO alterado por esta correção. HISTÓRICO: Valor aproximado divulgado pela imprensa oficial ('quase meio milhão'), sem casa decimal exata. CONFLITO leve com o Mídia Kit MOBTV, que cita 'Central - 478 Mil', fonte 'Dados Oficiais - Metrô/DF', sem data de referência explícita — provavelmente mesma série de dados em período ligeiramente diferente. Recomendação: usar o valor da Agência Brasília por ter data e fonte publicada verificável; registrar o do mídia kit como dado complementar. | [Renda] Relatório localizado mas os valores de renda (Tabelas A.66/A.67) não puderam ser extraídos nesta pesquisa. | Estação localizada no Plano Piloto (Rodoviária do Plano Piloto / Asa Sul-Asa Norte). REVISÃO (auditoria profunda, rodada 4): reexaminado — fonte (Agência Brasília/Metrô-DF, com data e URL) é a melhor disponível e já supera o valor arredondado do mídia kit ('478 Mil'); nenhuma fonte mais recente ou mais granular foi localizada nesta rodada. MANTIDO sem alteração. RENDA PENDENTE (integração ao site, pós-revisão): foram encontrados valores de renda domiciliar média para Asa Sul (R$ 16.455,00/mês) e Asa Norte (R$ 13.334,00/mês), mas NENHUM havia sido aplicado a este ponto até esta correção — a Estação Central é a Rodoviária do Plano Piloto, interligação central que atende tanto a Asa Sul quanto a Asa Norte (e o fluxo intermunicipal/regional em geral), sem correspondência territorial defensável com um único bairro; por isso a renda permanecera N/D até que o cliente decidisse explicitamente usar a média dos dois valores como proxy (ver CORREÇÃO PONTUAL acima).",
  },
  "estacao-shopping": {
    slug: "estacao-shopping",
    researchCategory: "Metrô",
    referenceArea: "Brasília (Plano Piloto)",
    metrics: [
      {
        type: "passengers",
        value: 260642,
        unit: "passageiros/mês",
        raw: "260.642 passageiros/mês",
        period: "média mensal 2024 (divulgado em 20/01/2025)",
        source: "Agência Brasília / Metrô-DF",
        sourceQuality: "A",
        estimated: false,
      },
      {
        type: "audited_impacts",
        value: 732239,
        unit: "impactos/mês",
        raw: "732.239 (impactos/mês (Datavision))",
        source: "Datavision / Mídia Kit MOBTV",
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 16455.0,
      type: "domiciliar",
      typeLabel:
        "domiciliar média (Asa Sul (Plano Piloto), Informado pelo usuário (integração ao site, pós-revisão))",
      raw: "R$ 16.455,00 (domiciliar) — Asa Sul (Plano Piloto)",
      source: "Valor informado manualmente pelo usuário — ver notes",
      sourceQuality: "B",
    },
    demographics: {
      averageAge: 40.5,
      gender: { femalePercent: 54, malePercent: 46 },
    },
    averageDwellTime: "6 a 15 minutos (categoria Metrô/BRT, Mídia Kit MOBTV)",
    targetAudience:
      "Estudantes, trabalhadores e consumidores frequentes de serviços e varejo (categoria)",
    consumptionProfile: "Alimentação rápida, tecnologia, moda, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "Mídia Kit MOBTV cita 'Shopping - 263 Mil' (Dados Oficiais - Metrô/DF) — praticamente idêntico (dif. de ~1%), reforça confiabilidade. | [Renda] ATUALIZAÇÃO (integração ao site, pós-revisão): renda domiciliar média de Asa Sul (R$ 16.455,00/mês) aplicada a este ponto especificamente — NÃO ao Plano Piloto como um todo — porque a nota de auditoria já registrada para esta estação (rodadas anteriores) confirma correspondência territorial direta e defensável: 'Estação Shopping atende o bairro Asa Sul'. Renda de Asa Norte (R$ 13.334,00/mês, também domiciliar) NÃO aplicada aqui por não corresponder a este ponto. Valor de R$ 10.407,82 citado em pesquisas anteriores NÃO utilizado por ser renda PER CAPITA (não domiciliar/familiar) — não deve ser misturado com estas métricas. | Estação 'Shopping' atende o bairro Asa Sul (Plano Piloto), NÃO deve ser confundida com estações de Taguatinga. REVISÃO (auditoria profunda, rodada 4): reexaminado — valor da Agência Brasília já é ~1% acima do mídia kit ('263 Mil'), diferença dentro da margem de arredondamento entre a mesma série de dados; nenhuma fonte alternativa mais robusta encontrada. MANTIDO sem alteração. ATUALIZAÇÃO (integração ao site): renda domiciliar de Asa Sul (R$ 16.455,00/mês) aplicada com base em correspondência territorial já documentada.",
  },
  "estacao-aguas-claras": {
    slug: "estacao-aguas-claras",
    researchCategory: "Metrô",
    referenceArea: "Águas Claras",
    metrics: [
      {
        type: "passengers",
        value: 262352,
        unit: "passageiros/mês",
        raw: "262.352 passageiros/mês",
        period: "média mensal 2024 (divulgado em 20/01/2025)",
        source: "Agência Brasília / Metrô-DF",
        sourceQuality: "A",
        estimated: false,
      },
      {
        type: "audited_impacts",
        value: 1000000,
        unit: "impactos/mês",
        raw: "1.000.000 (impactos/mês (Datavision, conforme tabela consolidada))",
        source: "Datavision / Mídia Kit MOBTV",
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 12000.0,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, fornecida manualmente pelo usuário)",
      raw: "R$ 12.000,00 (domiciliar)",
      source: "Valor informado manualmente pelo usuário — ver notes",
      sourceQuality: "B",
    },
    demographics: {
      averageAge: 35.9,
      gender: { femalePercent: 53.3, malePercent: 46.7 },
    },
    averageDwellTime: "6 a 15 minutos (categoria Metrô/BRT, Mídia Kit MOBTV)",
    targetAudience:
      "Estudantes, trabalhadores e consumidores frequentes de serviços e varejo (categoria)",
    consumptionProfile: "Alimentação rápida, tecnologia, moda, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "Mídia Kit MOBTV cita 'Águas Claras - 269 Mil' (Dados Oficiais - Metrô/DF) — muito próximo (dif. ~2,5%). | [Renda] ATUALIZAÇÃO (integração ao site, pós-revisão): renda DOMICILIAR média de R$ 12.000,00/mês informada pelo usuário para Águas Claras, preenchendo a lacuna desta RA — aplicada a todos os pontos com correspondência territorial confirmada em Águas Claras (Estação Águas Claras e Estação Arniqueiras). O relatório PDAD 2021 oficial existe para esta RA, mas a tabela de renda não pôde ser extraída nesta pesquisa nas rodadas anteriores; este valor substitui apenas a lacuna (N/D), não um dado já existente. | REVISÃO (auditoria profunda, rodada 4): reexaminado — valor da Agência Brasília é ~2,5% menor que o do mídia kit ('269 Mil'), diferença de arredondamento, não motivo para troca (fonte da Agência Brasília tem data e URL verificável, mais defensável que a cifra do mídia kit sem data). MANTIDO sem alteração.",
  },
  "estacao-arniqueiras": {
    slug: "estacao-arniqueiras",
    researchCategory: "Metrô",
    referenceArea: "Águas Claras",
    metrics: [
      {
        type: "passengers",
        value: 267314,
        unit: "passageiros/mês",
        raw: "267.314 passageiros/mês",
        period: "média mensal 2024 (divulgado em 20/01/2025)",
        source: "Agência Brasília / Metrô-DF",
        sourceQuality: "A",
        estimated: false,
      },
      {
        type: "audited_impacts",
        value: 1128365,
        unit: "impactos/mês",
        raw: "1.128.365 (impactos/mês (Datavision))",
        source: "Datavision / Mídia Kit MOBTV",
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 12000.0,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, fornecida manualmente pelo usuário)",
      raw: "R$ 12.000,00 (domiciliar)",
      source: "Valor informado manualmente pelo usuário — ver notes",
      sourceQuality: "B",
    },
    demographics: {
      averageAge: 35.9,
      gender: { femalePercent: 53.3, malePercent: 46.7 },
    },
    averageDwellTime: "6 a 15 minutos (categoria Metrô/BRT, Mídia Kit MOBTV)",
    targetAudience:
      "Estudantes, trabalhadores e consumidores frequentes de serviços e varejo (categoria)",
    consumptionProfile: "Alimentação rápida, tecnologia, moda, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "Mídia Kit MOBTV cita 'Arniqueiras - 275 Mil' (dif. ~3%). | [Renda] ATUALIZAÇÃO (integração ao site, pós-revisão): renda DOMICILIAR média de R$ 12.000,00/mês informada pelo usuário para Águas Claras, preenchendo a lacuna desta RA — aplicada a todos os pontos com correspondência territorial confirmada em Águas Claras (Estação Águas Claras e Estação Arniqueiras). O relatório PDAD 2021 oficial existe para esta RA, mas a tabela de renda não pôde ser extraída nesta pesquisa nas rodadas anteriores; este valor substitui apenas a lacuna (N/D), não um dado já existente. | A estação está tecnicamente na RA Águas Claras; a RA Arniqueira (desmembrada em 2019) é uma região vizinha mas o perfil demográfico usado aqui é o de Águas Claras, conforme a localização confirmada da estação. REVISÃO (auditoria profunda, rodada 4): esta atribuição foi VERIFICADA especificamente — pesquisa confirmou que o território da RA Arniqueira (criada em 2019) cobre apenas o bairro Areal, a ADE e as QS 6-10, sem incluir o corredor do metrô; a Wikipédia sobre a Estação Arniqueiras confirma explicitamente 'atende a região administrativa de Águas Claras'. Não foi possível obter uma confirmação de nível A (mapa cadastral oficial SEDUH/Codeplan com sobreposição de polígonos), mas duas fontes convergentes (nível B) sustentam a atribuição atual. NENHUMA MUDANÇA aplicada — atribuição confirmada como correta.",
  },
  "estacao-praca-do-relogio": {
    slug: "estacao-praca-do-relogio",
    researchCategory: "Metrô",
    referenceArea: "Taguatinga",
    metrics: [
      {
        type: "passengers",
        value: 200000,
        unit: "passageiros/mês",
        raw: "200.000 passageiros/mês (aprox.)",
        period: "não especificado no Mídia Kit",
        source: "Mídia Kit MOBTV, atribuído a 'Dados Oficiais - Metrô/DF'",
        sourceQuality: "A",
        estimated: true,
      },
      {
        type: "audited_impacts",
        value: 1063504,
        unit: "impactos/mês",
        raw: "1.063.504 (impactos/mês (Datavision))",
        source: "Datavision / Mídia Kit MOBTV",
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 6072.92,
      type: "familiar",
      typeLabel:
        "familiar média (RA, fornecida manualmente pelo usuário) — NÃO é domiciliar nem per capita",
      raw: "R$ 6.072,92 (familiar)",
      source: "Valor informado manualmente pelo usuário — ver notes",
      sourceQuality: "B",
    },
    demographics: {
      averageAge: 37.3,
      gender: { femalePercent: 54.1, malePercent: 45.9 },
    },
    averageDwellTime: "6 a 15 minutos (categoria Metrô/BRT, Mídia Kit MOBTV)",
    targetAudience:
      "Estudantes, trabalhadores e consumidores frequentes de serviços e varejo (categoria)",
    consumptionProfile: "Alimentação rápida, tecnologia, moda, serviços financeiros (categoria)",
    publicationReadiness: "B",
    historicalConfidence: "A",
    notes:
      "REGRA MÍDIA KIT (nova instrução do cliente, pós-revisão): o Mídia Kit oficial da MOBTV é considerado fonte primária e 100% confiável para dados internos fornecidos pela própria MOBTV — todo número proveniente diretamente do Mídia Kit deve ser preservado, tratado como fonte A, e não substituído por fonte externa nem rebaixado por divergência com outra fonte. Valor de 200.000 passageiros/mês (Mídia Kit) RESTAURADO como valor oficial deste ponto. HISTÓRICO (auditoria profunda, rodada 4 — revertido nesta correção): a reportagem da Agência Brasília (jan/2025) sobre passageiros por estação em 2024 lista Central, Arniqueiras, Águas Claras e Shopping, mas NÃO divulga o número de Praça do Relógio. Foi localizada uma fonte de imprensa independente — Jornal Capital Federal (05/06/2025), sobre a revitalização da praça — citando 'cerca de 10 mil usuários todos os dias' na estação (~300.000/mês). Por instrução expressa do cliente, essa fonte externa NÃO substitui o dado do Mídia Kit — mantida aqui apenas como referência documentada, não descartada, para rastreabilidade: Jornal Capital Federal, https://jornalcapitalfederal.com.br/2025/06/05/praca-do-relogio-renasce-em-taguatinga-com-investimento-de-r-6-milhoes/ (~10.000 usuários/dia ≈ 300.000/mês, NÃO usado como substituto). A mesma reportagem cita ainda 'mais de 100 mil pessoas' circulando pela PRAÇA em si (fluxo de pedestres na área pública, métrica distinta de passageiros da estação — não confundir, não utilizada). | [Renda] ATUALIZAÇÃO (integração ao site, pós-revisão): renda FAMILIAR média de R$ 6.072,92/mês informada pelo usuário para Taguatinga, preenchendo a lacuna desta RA. Tipo 'renda familiar' preservado distintamente de 'domiciliar' e de 'per capita' — não deve ser tratado como equivalente a nenhum dos dois. O relatório PDAD 2021 existe e menciona a Seção 3.7 'Rendimento' (Tabelas A.66/A.67), mas os valores de renda domiciliar/per capita não puderam ser extraídos do PDF nesta pesquisa (documento truncado na ferramenta de leitura antes da tabela); apenas a renda média do trabalho principal havia sido capturada anteriormente: R$ 3.223,31 (indicador PARCIAL, preservado aqui como contexto histórico, não é renda domiciliar nem familiar). | ATUALIZAÇÃO (regra Mídia Kit): valor restaurado para o número oficial do Mídia Kit MOBTV (200.000/mês) e reclassificado como fonte A, por instrução expressa do cliente.",
  },
  "terminal-brt-gama": {
    slug: "terminal-brt-gama",
    researchCategory: "BRT",
    referenceArea: "Gama",
    metrics: [
      {
        type: "passengers",
        value: 350000,
        unit: "passageiros/mês",
        raw: "350.000 passageiros/mês (aprox.)",
        period: "não especificado",
        source: "Mídia Kit MOBTV (slide 'Mapa de Cobertura BRT-DF')",
        sourceQuality: "A",
        estimated: true,
      },
      {
        type: "audited_impacts",
        value: 2149173,
        unit: "impactos/mês",
        raw: "2.149.173 (impactos/mês (Datavision, soma de 2 painéis))",
        source: "Datavision / Mídia Kit MOBTV",
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 5034.4,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 5.034,40 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 36.1,
      gender: { femalePercent: 53, malePercent: 47 },
    },
    averageDwellTime: "6 a 15 minutos (categoria Metrô/BRT, Mídia Kit MOBTV)",
    targetAudience:
      "Estudantes, trabalhadores e consumidores frequentes de serviços e varejo (categoria)",
    consumptionProfile: "Alimentação rápida, tecnologia, moda, serviços financeiros (categoria)",
    publicationReadiness: "B",
    historicalConfidence: "A",
    notes:
      "REGRA MÍDIA KIT (nova instrução do cliente, pós-revisão): o Mídia Kit oficial da MOBTV é considerado fonte primária e 100% confiável para dados internos fornecidos pela própria MOBTV — todo número proveniente diretamente do Mídia Kit deve ser tratado como fonte A, sem rebaixamento por falta de citação explícita da metodologia no slide. Valor de 350.000/mês RECLASSIFICADO de D para A nesta correção (valor em si nunca foi alterado). HISTÓRICO: fonte do número não identificada explicitamente no slide (provavelmente SEMOB-DF); busca em SEMOB-DF, DFTrans e dados abertos GDF não localizou planilha pública independente com passageiros por terminal de BRT. REVISÃO (auditoria profunda, rodada 4): a mesma reportagem usada para o BRT Santa Maria (Jornal de Brasília, 'GDF inaugura seis rodoviárias e amplia mobilidade no DF') cita para o Terminal do Gama 'beneficia mais de 30 mil pessoas' — frase AMBÍGUA quanto à métrica (parece se referir a população atendida/beneficiada pela reforma, não a embarques ou passageiros/dia). NÃO usada como substituição por não ser uma métrica clara e comparável, e por instrução do cliente de preservar o dado do Mídia Kit sem substituição por fonte externa. | Por decisão do solicitante, os dois painéis físicos do terminal (BRT Gama 1 e 2) foram consolidados em um único ponto de mídia. ATUALIZAÇÃO (regra Mídia Kit): classificação elevada de D para A por instrução expressa do cliente (valor inalterado).",
  },
  "terminal-brt-santa-maria": {
    slug: "terminal-brt-santa-maria",
    researchCategory: "BRT",
    referenceArea: "Santa Maria",
    metrics: [
      {
        type: "passengers",
        value: 375000,
        unit: "passageiros/mês",
        raw: "375.000 passageiros/mês (aprox.)",
        period: "não especificado",
        source: "Mídia Kit MOBTV (slide 'Mapa de Cobertura BRT-DF')",
        sourceQuality: "A",
        estimated: true,
      },
      {
        type: "audited_impacts",
        value: 3745600,
        unit: "impactos/mês",
        raw: "3.745.600 (impactos/mês (Datavision, soma de 2 painéis))",
        source: "Datavision / Mídia Kit MOBTV",
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 3813.9,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 3.813,90 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 33.1,
      gender: { femalePercent: 52.5, malePercent: 47.5 },
    },
    averageDwellTime: "6 a 15 minutos (categoria Metrô/BRT, Mídia Kit MOBTV)",
    targetAudience:
      "Estudantes, trabalhadores e consumidores frequentes de serviços e varejo (categoria)",
    consumptionProfile: "Alimentação rápida, tecnologia, moda, serviços financeiros (categoria)",
    publicationReadiness: "B",
    historicalConfidence: "A",
    notes:
      "REGRA MÍDIA KIT (nova instrução do cliente, pós-revisão): o Mídia Kit oficial da MOBTV é considerado fonte primária e 100% confiável para dados internos fornecidos pela própria MOBTV — todo número proveniente diretamente do Mídia Kit deve ser preservado, tratado como fonte A, e não substituído por fonte externa nem rebaixado por divergência com outra fonte. Valor de 375.000 passageiros/mês (Mídia Kit) RESTAURADO como valor oficial deste ponto. HISTÓRICO (auditoria profunda, rodada 4 — revertido nesta correção): havia sido encontrada uma fonte de imprensa independente (Jornal de Brasília, 'GDF inaugura seis rodoviárias e amplia mobilidade no DF') citando '~37.000 embarques diários' (~1.110.000/mês) para este terminal — um número substancialmente maior, mas de métrica distinta ('embarques', não 'passageiros') e não confirmado por documento oficial auditado. Por instrução expressa do cliente, essa fonte externa NÃO substitui o dado do Mídia Kit — mantida aqui apenas como referência documentada, não descartada, para rastreabilidade: Jornal de Brasília, https://jornaldebrasilia.com.br/brasilia/gdf-inaugura-seis-rodoviarias-e-amplia-mobilidade-no-df/ (~37.000 embarques/dia ≈ 1.110.000 embarques/mês, NÃO usado como substituto). | Por decisão do solicitante, os dois painéis físicos do terminal (BRT Santa Maria 1 e 2) foram consolidados em um único ponto de mídia. ATUALIZAÇÃO (regra Mídia Kit): valor restaurado para o número oficial do Mídia Kit MOBTV (375.000/mês) e reclassificado como fonte A, por instrução expressa do cliente.",
  },
  "rodoviaria-de-sobradinho": {
    slug: "rodoviaria-de-sobradinho",
    researchCategory: "Terminal Rodoviário",
    referenceArea: "Sobradinho",
    metrics: [
      {
        type: "passengers",
        value: 840000,
        unit: "passageiros/mês",
        raw: "840.000 passageiros/mês (estimativa mensal, derivada de ~28.000 passageiros/dia)",
        period: "reportagem de 2020 (contexto: reabertura pós-reforma do terminal)",
        source:
          "Jornal de Brasília — 'Cinco anos após reforma, Rodoviária de Sobradinho amplia mobilidade de moradores'",
        sourceQuality: "B",
        estimated: true,
      },
    ],
    income: {
      value: 6010.8,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 6.010,80 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 36.5,
      gender: { femalePercent: 52.9, malePercent: 47.1 },
    },
    averageDwellTime: undefined,
    targetAudience: undefined,
    consumptionProfile: undefined,
    publicationReadiness: "B",
    historicalConfidence: "C",
    notes:
      "REVISÃO (auditoria profunda): a estimativa operacional provisória de 300.000/mês (sem fonte, cadastrada apenas para permitir o fechamento da base na rodada anterior) foi SUBSTITUÍDA por uma fonte de imprensa real e datada — 'cerca de 28 mil passageiros por dia' na Rodoviária de Sobradinho, citado por ocasião dos 5 anos da reforma do terminal (reabertura em 2020). 28.000 × 30 = 840.000/mês. Isso é um upgrade de qualidade C (estimativa operacional nossa, sem fonte) para qualidade B (estimativa de imprensa, documentada e datada), embora AINDA NÃO seja dado oficial auditado — nenhum funcionário da SEMOB-DF é citado nominalmente na reportagem, e as URLs diretas da Agência Brasília/SEMOB sobre a reforma continuam retornando erro 404 em todas as tentativas (4 rodadas de pesquisa). AUMENTO DE ~2,8x em relação à estimativa provisória anterior — não há mudança de metodologia da nossa parte; é simplesmente a primeira vez que uma fonte real com número específico foi localizada para este ponto. Valor anterior (300.000/mês, sem fonte) preservado neste registro como alternativa descartada, para rastreabilidade. HISTÓRICO (rodadas 1-3): O Mídia Kit MOBTV apenas inclui a 'Rodoviária de Sobradinho' dentro de uma lista agregada de 12 locais de 'Transporte Público' com a alegação genérica de '+3 milhões de pessoas/mês' para o CONJUNTO (não desagregado por local) — não deve ser usado como dado do ponto. Buscas em SEMOB-DF/DFTrans e dados.df.gov.br não localizaram planilha oficial de movimentação por terminal em nenhuma das 4 rodadas. | Estimativa de imprensa (2020, reabertura pós-reforma), qualidade B — melhor que a estimativa operacional provisória anterior, mas ainda não é dado oficial auditado. Recomenda-se solicitar dado direto à SEMOB-DF/Administração Regional de Sobradinho antes de publicar sem essa ressalva.",
  },
  "terminal-setor-o": {
    slug: "terminal-setor-o",
    researchCategory: "Terminal Rodoviário",
    referenceArea: "Ceilândia",
    metrics: [
      {
        type: "passengers",
        value: 450000,
        unit: "passageiros/mês",
        raw: "450.000 passageiros/mês (estimativa, derivada de ~15.000 passageiros/dia)",
        period:
          "estimativa original de 2013 (inauguração do terminal), sem confirmação de que ainda reflete o uso atual",
        source:
          "Correio Braziliense — 'GDF inaugura novo terminal rodoviário no Setor O em Ceilândia' (10/05/2013)",
        sourceQuality: "B",
        estimated: true,
      },
    ],
    income: {
      value: 4491.1,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 4.491,10 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 34.8,
      gender: { femalePercent: 52.8, malePercent: 47.2 },
    },
    averageDwellTime: undefined,
    targetAudience: undefined,
    consumptionProfile: undefined,
    publicationReadiness: "B",
    historicalConfidence: "D",
    notes:
      "3ª RODADA: valor fornecido manualmente pelo usuário — '≈15.000 passageiros/dia', padronizado para '≈450.000 passageiros/mês' (15.000 × 30). REVISÃO (auditoria profunda): localizada a origem documentada desta exata cifra — reportagem do Correio Braziliense sobre a inauguração do terminal em 10/05/2013: 'A estimativa é de que 15 mil passageiros passem pelo local diariamente'. Isso transforma o dado de 'estimativa sem fonte' em 'estimativa de imprensa com fonte e data', mas revela que é uma projeção de 2013 (por ocasião da inauguração), NÃO uma medição atual — o terminal pode ter mudado de uso desde então (expansões, mudanças de linhas, crescimento populacional da região). Ainda CADASTRADO COMO ESTIMATIVA (qualidade B), NÃO como contagem oficial auditada — não deve ser apresentado no site como estatística oficial atual da SEMOB-DF/DFTrans. HISTÓRICO (rodadas 1-3): nova busca por notícias de modernização/reforma do terminal não havia retornado matéria com número de passageiros; tentativa de acesso a DATASUS/SEMOB dados abertos não encontrou planilha por terminal; catálogo dados.df.gov.br/SEMOB não expõe dataset por terminal; navegador interativo permaneceu desconectado em todas as rodadas. | Valor cadastrado como estimated=true, qualidade B. Recomenda-se confirmar com SEMOB-DF/DFTrans um número oficial auditado antes de uso comercial contínuo.",
  },
  "upa-brazlandia": {
    slug: "upa-brazlandia",
    researchCategory: "UPA",
    referenceArea: "Brazlândia",
    metrics: [
      {
        type: "procedures",
        value: 25732,
        unit: "procedimentos/mês",
        raw: "25.732 procedimentos/mês (média jan-jun/2026)",
        period: "média jan-jun/2026",
        source:
          'InfoSaúde / SES-DF — painel "UPAs - Pronto atendimento — Procedimentos realizados"',
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 3425.6,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 3.425,60 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 33.5,
      gender: { femalePercent: 51.3, malePercent: 48.7 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "CORREÇÃO (jan-jun/2026): indicador principal trocado de 'atendimentos' (3.526/mês, 1º quadrimestre 2024) para PROCEDIMENTOS REALIZADOS, conforme série oficial do painel InfoSaúde/SES-DF conferida manualmente pelo cliente — procedimentos e atendimentos são indicadores DISTINTOS (um atendimento pode gerar múltiplos procedimentos), não comparáveis diretamente. Série mensal jan-jun/2026: jan=21.001, fev=19.051, mar=28.115, abr=27.562, mai=31.183, jun=27.478 — média = 25.731,67 ≈ 25.732/mês. Valor antigo (3.526 atendimentos/mês, 1º Quadrimestre 2024, SES-DF/IgesDF) preservado abaixo como registro histórico, para rastreabilidade — não descartado, apenas substituído como indicador principal do ponto. HISTÓRICO: Total no quadrimestre 2024: 14.104 atendimentos em 4 meses (média mensal calculada = total ÷ 4). Acolhimentos com classificação de risco no mesmo período: 19.662 (indicador DIFERENTE de 'atendimentos' — não somado ao total para evitar dupla contagem). Notícia de fev/2023 (anoticiacerta.com.br) citava 'mais de 30 mil atendimentos' no 1º ano de funcionamento (~2022, fonte não-SES-DF, período impreciso) — dado mais antigo e menos confiável, substituído pelo relatório oficial 2024. REVISÃO (auditoria profunda, rodada 4): nova busca por relatório SES-DF/IgesDF mais recente que 1º Quadrimestre/2024 não encontrou atualização publicada; fonte permanece a melhor disponível (A, institucional, auditável). MANTIDO sem alteração (até a correção de procedimentos acima).",
  },
  "upa-ceilandia-setor-o": {
    slug: "upa-ceilandia-setor-o",
    researchCategory: "UPA",
    referenceArea: "Ceilândia",
    metrics: [
      {
        type: "procedures",
        value: 62165,
        unit: "procedimentos/mês",
        raw: "62.165 procedimentos/mês (média jan-jun/2026)",
        period: "média jan-jun/2026",
        source:
          "InfoSaúde / SES-DF — painel \"UPAs - Pronto atendimento — Procedimentos realizados\" (estabelecimento listado como 'UPA II Ceilândia')",
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 4491.1,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 4.491,10 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 34.8,
      gender: { femalePercent: 52.8, malePercent: 47.2 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "CORREÇÃO (jan-jun/2026): indicador principal trocado de 'atendimentos' (12.740/mês, 1º quadrimestre 2024) para PROCEDIMENTOS REALIZADOS, conforme série oficial do painel InfoSaúde/SES-DF conferida manualmente pelo cliente. RESSALVA DE CORRESPONDÊNCIA: o ponto MOBTV \"UPA Ceilândia Setor O\" corresponde à \"UPA II Ceilândia\" no painel InfoSaúde — mesma unidade, nomenclatura distinta entre as duas fontes. Série mensal jan-jun/2026: jan=63.254, fev=55.303, mar=63.309, abr=64.422, mai=66.225, jun=60.479 — média = 62.165,33 ≈ 62.165/mês. Valor antigo (12.740 atendimentos/mês, 1º Quadrimestre 2024, SES-DF/IgesDF) preservado abaixo como registro histórico, para rastreabilidade — não descartado, apenas substituído como indicador principal do ponto. HISTÓRICO: Total no quadrimestre 2024: 50.959 atendimentos em 4 meses (média mensal calculada = total ÷ 4). Acolhimentos com classificação de risco no mesmo período: 32.131 (indicador DIFERENTE de 'atendimentos' — não somado ao total para evitar dupla contagem). Relatório mais antigo (1º Quadrimestre 2023, mesma fonte SES-DF): 31.603 atendimentos/4 meses (~7.901/mês) — mostra crescimento expressivo entre 2023 e 2024, ou possível mudança de metodologia de contagem. REVISÃO (auditoria profunda, rodada 4): crescimento 2023→2024 (~61%) investigado como possível outlier — consistente com aumento geral de demanda registrado em outras UPAs do DF no mesmo período (ex.: UPA Gama, mesma tendência abaixo); não há indício de mudança de unidade/nome/equipamento, portanto não é tratado como erro de correspondência, apenas registrado como variação a confirmar. Nenhuma fonte mais recente que 2024 localizada para o indicador de atendimentos (MANTIDO até a correção de procedimentos acima).",
  },
  "upa-gama": {
    slug: "upa-gama",
    researchCategory: "UPA",
    referenceArea: "Gama",
    metrics: [
      {
        type: "procedures",
        value: 42061,
        unit: "procedimentos/mês",
        raw: "42.061 procedimentos/mês (média jan-jun/2026)",
        period: "média jan-jun/2026",
        source:
          'InfoSaúde / SES-DF — painel "UPAs - Pronto atendimento — Procedimentos realizados"',
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 5034.4,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 5.034,40 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 36.1,
      gender: { femalePercent: 53, malePercent: 47 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "CORREÇÃO (jan-jun/2026): indicador principal trocado de 'atendimentos' (10.887/mês, 1º quadrimestre 2024) para PROCEDIMENTOS REALIZADOS, conforme série oficial do painel InfoSaúde/SES-DF conferida manualmente pelo cliente. Série mensal jan-jun/2026: jan=42.889, fev=36.613, mar=40.874, abr=43.095, mai=44.314, jun=44.581 — média = 42.061/mês (exata). Valor antigo (10.887 atendimentos/mês, 1º Quadrimestre 2024, SES-DF/IgesDF) preservado abaixo como registro histórico, para rastreabilidade — não descartado, apenas substituído como indicador principal do ponto. HISTÓRICO: Total no quadrimestre 2024: 43.548 atendimentos em 4 meses (média mensal calculada = total ÷ 4). Acolhimentos com classificação de risco no mesmo período: 30.038 (indicador DIFERENTE de 'atendimentos' — não somado ao total para evitar dupla contagem). Relatório mais antigo (1º Quadrimestre 2023, mesma fonte SES-DF): 29.086 atendimentos/4 meses (~7.272/mês). REVISÃO (auditoria profunda, rodada 4): mesmo padrão de crescimento 2023→2024 observado em outras UPAs do DF (ver UPA Ceilândia II) — reforça que é tendência real de aumento de demanda, não erro pontual desta unidade (MANTIDO até a correção de procedimentos acima).",
  },
  "upa-planaltina": {
    slug: "upa-planaltina",
    researchCategory: "UPA",
    referenceArea: "Planaltina",
    metrics: [
      {
        type: "procedures",
        value: 31497,
        unit: "procedimentos/mês",
        raw: "31.497 procedimentos/mês (média jan-jun/2026)",
        period: "média jan-jun/2026",
        source:
          'InfoSaúde / SES-DF — painel "UPAs - Pronto atendimento — Procedimentos realizados"',
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 3183.47,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, fornecida manualmente pelo usuário)",
      raw: "R$ 3.183,47 (domiciliar)",
      source: "Valor informado manualmente pelo usuário — ver notes",
      sourceQuality: "B",
    },
    demographics: {
      averageAge: 33.5,
      gender: { femalePercent: 51.8, malePercent: 48.2 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "CORREÇÃO (jan-jun/2026): indicador principal trocado de 'atendimentos' (10.935/mês, 1º quadrimestre 2024) para PROCEDIMENTOS REALIZADOS, conforme série oficial do painel InfoSaúde/SES-DF conferida manualmente pelo cliente. Série mensal jan-jun/2026: jan=31.365, fev=27.893, mar=30.575, abr=31.459, mai=33.719, jun=33.968 — média = 31.496,5 ≈ 31.497/mês. Valor antigo (10.935 atendimentos/mês, 1º Quadrimestre 2024, SES-DF/IgesDF) preservado abaixo como registro histórico, para rastreabilidade — não descartado, apenas substituído como indicador principal do ponto. HISTÓRICO: Total no quadrimestre 2024: 43.739 atendimentos em 4 meses (média mensal calculada = total ÷ 4). Acolhimentos com classificação de risco no mesmo período: 26.550 (indicador DIFERENTE de 'atendimentos' — não somado ao total para evitar dupla contagem). REVISÃO (auditoria profunda, rodada 4): reexaminado — fonte SES-DF/IgesDF 1º Quadrimestre/2024 permanece a única encontrada com correspondência direta e auditável para este ponto; nenhuma fonte mais recente localizada (MANTIDO até a correção de procedimentos acima). | [Renda] Valor fornecido manualmente pelo usuário na 3ª rodada ('renda domiciliar média R$ 3.183,47/mês'), preenchendo a lacuna que a extração automática do relatório PDAD 2021 não havia conseguido nas rodadas anteriores. O usuário não especificou a fonte/URL exata usada para obter este número — classificado como qualidade B (fonte secundária confiável/estimativa documentada). Recomenda-se ao site obter a fonte primária exata antes de citar publicamente.",
  },
  "upa-riacho-fundo-ii": {
    slug: "upa-riacho-fundo-ii",
    researchCategory: "UPA",
    referenceArea: "Riacho Fundo II",
    metrics: [
      {
        type: "procedures",
        value: 30281,
        unit: "procedimentos/mês",
        raw: "30.281 procedimentos/mês (média jan-jun/2026)",
        period: "jan-jun/2026 (competência consultada: 2026/06)",
        source:
          "InfoSaúde-DF — Sala de Situação > Atenção Especializada > UPAs - Pronto Atendimento (estabelecimento listado como 'UPA Riacho Fundo')",
        sourceQuality: "B",
        estimated: false,
      },
    ],
    income: {
      value: 3101.0,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, fornecida manualmente pelo usuário)",
      raw: "R$ 3.101,00 (domiciliar)",
      source: "Valor informado manualmente pelo usuário — ver notes",
      sourceQuality: "B",
    },
    demographics: {
      averageAge: 32.2,
      gender: { femalePercent: 52.4, malePercent: 47.6 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "B",
    historicalConfidence: "B",
    notes:
      "3ª RODADA: dado fornecido manualmente pelo usuário na 3ª rodada, extraído diretamente do painel InfoSaúde-DF, onde o estabelecimento foi informado como 'UPA Riacho Fundo' (SEM 'II'). REVISÃO (auditoria profunda): pesquisa adicional buscou especificamente uma UPA na RA 'Riacho Fundo' (I, distinta de 'Riacho Fundo II') e NÃO encontrou nenhuma — a página de saúde da própria Administração Regional do Riacho Fundo I (riachofundo1.df.gov.br) lista apenas uma UBS (Unidade Básica de Saúde), não uma UPA; todas as buscas por 'UPA Riacho Fundo' convergem para a unidade inaugurada em Riacho Fundo II em novembro/2021. Isso REFORÇA (mas não prova 100%, pois não foi possível acessar o diretório completo de estabelecimentos da SES-DF/IgesDF) a hipótese de que são a mesma unidade. Por essa incerteza residual — mesmo após pesquisa adicional — a QUALIDADE DA FONTE foi mantida em B (não elevada a A): o painel InfoSaúde em si é uma fonte A/oficial, mas a CORRESPONDÊNCIA entre o nome no painel e este ponto da base não está 100% confirmada, o que rebaixa a classificação do PONTO como um todo (não da fonte em si) para B, seguindo a regra de não atribuir dado a um ponto sem poder defender totalmente a correspondência física. ATENÇÃO — RESSALVA DE CORRESPONDÊNCIA DE NOME (mantida): diferente do caso 'UPA Sobradinho' (onde o usuário confirmou explicitamente que era a mesma unidade que 'UPA Sobradinho II'), aqui a correspondência NÃO foi confirmada explicitamente. No Distrito Federal, 'Riacho Fundo' (RA XVII) e 'Riacho Fundo II' (RA XXI) são duas Regiões Administrativas distintas, o que teoricamente permitiria duas UPAs diferentes. Como 'UPA Riacho Fundo II' é o único ponto de Riacho Fundo na lista de 25 pontos fornecida pelo usuário (não há um ponto separado 'UPA Riacho Fundo I'), e por instrução expressa de não criar pontos duplicados por pequena diferença de nomenclatura, este dado foi aplicado a este ponto — mas SEM confirmação explícita do usuário, diferente do caso Sobradinho. RECOMENDA-SE FORTEMENTE confirmar no painel InfoSaúde se 'UPA Riacho Fundo' e 'UPA Riacho Fundo II' são de fato a mesma unidade antes de publicar sem ressalva. Série mensal de 2026 informada pelo usuário: jan=31.605, fev=27.523, mar=29.460, abr=32.558, mai=30.997, jun=29.541 — média jan-jun/2026 = 30.280,7 ≈ 30.281/mês. HISTÓRICO DE CONFLITO (rodadas 1-2, preservado para contexto): (1) relatório técnico oficial SES-DF, jan-abr/2024: 36.731 atendimentos em 4 meses (~9.183/mês); (2) reportagem de 27/11/2024 (agendacapital.com.br): 'mais de 52 mil atendimentos em 2024' (total anual, ~4.354/mês); (3) notícia oficial SES-DF com título indicando '~4 mil atendimentos mensais' (texto completo inacessível, erro 404). O novo valor de 2026 (~30.281/mês) é consideravelmente mais alto que todos os três achados anteriores, o que é PLAUSÍVEL como crescimento real de demanda entre 2024 e 2026, mas também reforça a necessidade de confirmar a correspondência exata da unidade antes de publicar. Indicador é 'procedimentos' (não 'atendimentos' nem 'pessoas únicas') — preservar essa terminologia; não comparar diretamente com o valor de 9.183 'atendimentos de urgência/mês' de 2024, que usa indicador distinto. | [Renda] Valor fornecido manualmente pelo usuário na 3ª rodada ('renda domiciliar média ≈ R$ 3.101,00/mês'), preenchendo a lacuna que a extração automática do relatório PDAD 2021 não havia conseguido nas rodadas anteriores. O usuário não especificou a fonte/URL exata usada para obter este número (o link acima é o relatório PDAD 2021 já conhecido para esta RA, mas não foi confirmado que o valor veio dele) — classificado como qualidade B (fonte secundária confiável/estimativa documentada). Recomenda-se ao site obter a fonte primária exata antes de citar publicamente. | RESSALVA IMPORTANTE: confirmar com a SES-DF/IgesDF se 'UPA Riacho Fundo' (nome no InfoSaúde) corresponde exatamente a 'UPA Riacho Fundo II' (nome usado nesta base e na lista original de 25 pontos) antes de publicar sem ressalva — ver nota de auditoria.",
  },
  "upa-vicente-pires": {
    slug: "upa-vicente-pires",
    researchCategory: "UPA",
    referenceArea: "Vicente Pires",
    metrics: [
      {
        type: "procedures",
        value: 45098,
        unit: "procedimentos/mês",
        raw: "45.098 procedimentos/mês (média jan-jun/2026)",
        period: "média jan-jun/2026",
        source:
          'InfoSaúde / SES-DF — painel "UPAs - Pronto atendimento — Procedimentos realizados"',
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 9257.0,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, fornecida manualmente pelo usuário)",
      raw: "R$ 9.257,00 (domiciliar)",
      source: "Valor informado manualmente pelo usuário — ver notes",
      sourceQuality: "B",
    },
    demographics: {
      averageAge: 34.6,
      gender: { femalePercent: 51.2, malePercent: 48.8 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "CORREÇÃO (jan-jun/2026): indicador principal trocado de 'atendimentos' (9.113/mês, 1º quadrimestre 2024) para PROCEDIMENTOS REALIZADOS, conforme série oficial do painel InfoSaúde/SES-DF conferida manualmente pelo cliente — confirma e substitui a estimativa de 'média de 6,6 mil PROCEDIMENTOS mensais' já citada no histórico abaixo. Série mensal jan-jun/2026: jan=42.295, fev=37.189, mar=49.120, abr=47.162, mai=49.008, jun=45.811 — média = 45.097,5 ≈ 45.098/mês. Valor antigo (9.113 atendimentos/mês, 1º Quadrimestre 2024, SES-DF/IgesDF) preservado abaixo como registro histórico, para rastreabilidade — não descartado, apenas substituído como indicador principal do ponto. HISTÓRICO: Total no quadrimestre 2024: 36.451 atendimentos em 4 meses (média mensal calculada = total ÷ 4). Acolhimentos com classificação de risco no mesmo período: 24.511 (indicador DIFERENTE de 'atendimentos' — não somado ao total para evitar dupla contagem). Notícia oficial (segov.df.gov.br) cita separadamente 'média de 6,6 mil PROCEDIMENTOS mensais em um ano' — indicador diferente de 'atendimentos' (procedimento ≠ atendimento; um atendimento pode gerar múltiplos procedimentos), não comparável diretamente à época (MANTIDO até a correção de procedimentos acima). | [Renda] Valor fornecido manualmente pelo usuário na 3ª rodada ('renda domiciliar média ≈ R$ 9.257,00/mês'), preenchendo a lacuna que a extração automática do relatório PDAD 2021 não havia conseguido nas rodadas anteriores. O usuário não especificou a fonte/URL exata usada para obter este número — classificado como qualidade B (fonte secundária confiável/estimativa documentada). Recomenda-se ao site obter a fonte primária exata antes de citar publicamente.",
  },
  "upa-ceilandia": {
    slug: "upa-ceilandia",
    researchCategory: "UPA",
    referenceArea: "Ceilândia",
    metrics: [
      {
        type: "procedures",
        value: 71340,
        unit: "procedimentos/mês",
        raw: "71.340 procedimentos/mês (média jan-jun/2026)",
        period: "média jan-jun/2026",
        source:
          "InfoSaúde / SES-DF — painel \"UPAs - Pronto atendimento — Procedimentos realizados\" (estabelecimento listado como 'UPA Ceilândia', distinta de 'UPA II Ceilândia')",
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 4491.1,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 4.491,10 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 34.8,
      gender: { femalePercent: 52.8, malePercent: 47.2 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "CORREÇÃO (jan-jun/2026): indicador principal trocado de 'atendimentos' (8.818/mês, imprensa citando painel IgesDF, jan-mai/2026) para PROCEDIMENTOS REALIZADOS, conforme série oficial do painel InfoSaúde/SES-DF conferida manualmente pelo cliente — esta é a UPA identificada simplesmente como 'UPA Ceilândia' no InfoSaúde, NÃO confundir com 'UPA II Ceilândia' (= ponto 'UPA Ceilândia Setor O' desta base). Série mensal jan-jun/2026: jan=67.001, fev=59.862, mar=72.836, abr=76.875, mai=76.483, jun=74.980 — média = 71.339,5 ≈ 71.340/mês. Valor antigo (8.818 atendimentos/mês, imprensa) preservado abaixo como registro histórico, para rastreabilidade — não descartado, apenas substituído como indicador principal do ponto. HISTÓRICO: o dado de 2019 (2.507/mês) foi SUBSTITUÍDO por um dado muito mais recente e melhor corroborado — duas reportagens INDEPENDENTES, ambas datadas de 26/05/2026 (Jornal de Brasília e Agita Brasília), ambas citando o painel epidemiológico em tempo real do IgesDF como fonte primária, informam '44.092 atendimentos' na UPA Ceilândia I entre janeiro e maio de 2026 (5 meses), com 'média mensal superior a 8 mil atendimentos' — as próprias reportagens descrevem a unidade como a de 'maior demanda assistencial do Distrito Federal'. 44.092 ÷ 5 = 8.818,4 ≈ 8.818/mês (média calculada, não estimativa). Qualidade mantida em B (não elevada a A) porque a fonte primária é um painel citado pela imprensa, não um documento PDF ou painel acessado diretamente por esta pesquisa — mas a corroboração por DUAS reportagens independentes na mesma data fortalece consideravelmente a confiabilidade em relação ao caso típico de fonte única. AUMENTO DE ~3,5x em relação ao valor anterior (2.507→8.818/mês) — investigado: não é artefato de mudança de indicador (o valor de 2019 usava 'atendimento médico em UPA', um subtipo de procedimento; o de 2026 usa 'atendimentos', um indicador mais amplo — se algo, essa mudança de indicador tenderia a diminuir o número, não aumentá-lo, o que reforça que o crescimento é real, não um artefato metodológico); é consistente com o hiato de 7 anos entre as medições e com a descrição da unidade como a de maior demanda do DF. Valor de 2019 (2.507/mês, relatório quadrimestral oficial SES-DF, 3º quad. 2019) preservado abaixo como registro histórico, para rastreabilidade — não foi localizado nas rodadas 1-3 um relatório quadrimestral OFICIAL mais recente especificamente da UPA-Ceilândia I (os relatórios 'UPAS_novas_..._Quad_2024' da SES-DF cobrem apenas UPAs mais novas, sem incluir esta). | Valor de 2026 via imprensa (8.818/mês, atendimentos) foi a melhor fonte disponível até esta correção — agora substituído pelo acesso direto ao painel oficial InfoSaúde/SES-DF (procedimentos, qualidade A). Dado histórico de 2019 (2.507/mês, relatório oficial SES-DF) mantido nesta base como registro auditável, não como indicador ativo.",
  },
  "upa-samambaia": {
    slug: "upa-samambaia",
    researchCategory: "UPA",
    referenceArea: "Samambaia",
    metrics: [
      {
        type: "procedures",
        value: 56565,
        unit: "procedimentos/mês",
        raw: "56.565 procedimentos/mês (média jan-jun/2026)",
        period: "média jan-jun/2026",
        source:
          "InfoSaúde / SES-DF — painel \"UPAs - Pronto atendimento — Procedimentos realizados\" (estabelecimento listado como 'UPA Tipo III Samambaia')",
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 4128.2,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 4.128,20 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 32.7,
      gender: { femalePercent: 52.6, malePercent: 47.4 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "CORREÇÃO (jan-jun/2026): indicador principal trocado de 'atendimentos' (6.167/mês, média 2024 via imprensa) para PROCEDIMENTOS REALIZADOS, conforme série oficial do painel InfoSaúde/SES-DF conferida manualmente pelo cliente — no painel o estabelecimento aparece como 'UPA Tipo III Samambaia', correspondente a este ponto MOBTV ('UPA Samambaia'). Série mensal jan-jun/2026: jan=61.578, fev=51.804, mar=57.902, abr=58.102, mai=55.507, jun=54.496 — média = 56.564,83 ≈ 56.565/mês. Valor antigo (6.167 atendimentos/mês) preservado abaixo como registro histórico, para rastreabilidade — não descartado, apenas substituído como indicador principal do ponto. HISTÓRICO: Total 2024: 'mais de 74 mil atendimentos' (ano completo) ÷ 12 = ~6.167/mês. Publicado 26/02/2025 por ocasião do aniversário de 14 anos da unidade (inaugurada em 15/02/2011, é a primeira UPA do DF). CONFLITO DE FONTES: a própria Secretaria de Saúde do DF publicou notícia com o título 'UPA de Samambaia registra mais de 155 mil atendimentos', mas não foi possível acessar o texto completo (link retornou erro 404) para confirmar o período de referência desse número — pode se tratar de total acumulado em período maior (ex.: desde a inauguração ou dois anos), não sendo diretamente comparável aos 74 mil de 2024. Recomenda-se usar o número de 74 mil/2024 por ter período claro e fonte confirmada. REVISÃO (auditoria profunda): valor de 6.167/mês CORROBORADO por uma segunda fonte independente (Jornal de Brasília, 26/02/2025, mesma efeméride, mesmo número de 74 mil atendimentos em 2024). Essa mesma reportagem também revela um dado de contexto valioso: quando o IgesDF assumiu a gestão da unidade em 2019, a média era de apenas ~2.000 atendimentos/mês — o que sugere que a cifra de '155 mil atendimentos' do título da SES-DF (inacessível) provavelmente se refere a um total ACUMULADO desde 2019 (6 anos de crescimento, de ~2.000 a ~6.167/mês, soma plausivelmente na faixa de 150-160 mil no total do período) — reforça a recomendação de NÃO usar os 155 mil como indicador mensal ou anual. Nenhum dado de 2025/2026 mais recente que fev/2025 foi localizado. Valor mantido em 6.167/mês, agora com maior confiança pela dupla corroboração. | Valor corroborado por duas fontes de imprensa independentes na auditoria profunda (rodada 4); permanecia sem confirmação por documento oficial primário até a correção de procedimentos acima (agora com fonte oficial InfoSaúde/SES-DF, qualidade A).",
  },
  "upa-sao-sebastiao": {
    slug: "upa-sao-sebastiao",
    researchCategory: "UPA",
    referenceArea: "São Sebastião",
    metrics: [
      {
        type: "procedures",
        value: 48273,
        unit: "procedimentos/mês",
        raw: "48.273 procedimentos/mês (média jan-jun/2026)",
        period: "jan-jun/2026 (competência consultada: 2026/06)",
        source:
          "InfoSaúde-DF — Sala de Situação > Atenção Especializada > UPAs - Pronto Atendimento",
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 2649.5,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 2.649,50 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 30.4,
      gender: { femalePercent: 51.5, malePercent: 48.5 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "3ª RODADA: dado fornecido manualmente pelo usuário, extraído diretamente do painel InfoSaúde-DF (Power BI), que esta pesquisa não conseguiu acessar de forma independente nas rodadas 1 e 2 por falta de navegador conectado. Série mensal de 2026 informada pelo usuário: jan=40.555, fev=40.918, mar=50.678, abr=53.880, mai=54.189, jun=49.416 — média jan-jun/2026 = 48.272,7 ≈ 48.273/mês, usada como indicador padronizado. Indicador é 'procedimentos' (não 'atendimentos' nem 'pessoas únicas') — preservar essa terminologia; não confundir com contagem de pacientes distintos. Este dado NÃO foi verificado independentemente por esta pesquisa (sem acesso ao painel); classificado como A/oficial por vir diretamente do sistema InfoSaúde-DF, conforme informado pelo usuário. Substitui o achado anterior ('90 mil atendidos desde a inauguração', sem período definido, hoje descartado por ser muito menos útil que este dado mensal oficial). | Dado mensal 2026 obtido pelo usuário diretamente no InfoSaúde-DF; recomenda-se ao site, antes de uso comercial contínuo, confirmar o acesso institucional ao painel para atualizações futuras. REVISÃO (auditoria profunda, rodada 4): reexaminado — nome do ponto (\"UPA São Sebastião\") corresponde diretamente à RA e ao estabelecimento sem ambiguidade; nenhuma fonte adicional necessária ou encontrada. MANTIDO sem alteração.",
  },
  "upa-sobradinho-ii": {
    slug: "upa-sobradinho-ii",
    researchCategory: "UPA",
    referenceArea: "Sobradinho II",
    metrics: [
      {
        type: "procedures",
        value: 54161,
        unit: "procedimentos/mês",
        raw: "54.161 procedimentos/mês (média jan-jun/2026)",
        period: "jan-jun/2026 (competência consultada: 2026/06)",
        source:
          "InfoSaúde-DF — Sala de Situação > Atenção Especializada > UPAs - Pronto Atendimento (estabelecimento listado como 'UPA Sobradinho')",
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 3808.8,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 3.808,80 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 34.9,
      gender: { femalePercent: 52.5, malePercent: 47.5 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "3ª RODADA: dado fornecido manualmente pelo usuário, extraído diretamente do painel InfoSaúde-DF. AMBIGUIDADE DE NOME (já identificada na 2ª rodada) agora ESCLARECIDA pelo usuário: no InfoSaúde o estabelecimento aparece listado apenas como 'UPA Sobradinho' (sem 'II'), confirmando a hipótese levantada anteriormente a partir do relatório de custos IgesDF 1º RDQA 2025. Tratado aqui como a mesma unidade do ponto 'UPA Sobradinho II' desta base (nenhum ponto duplicado criado). Série mensal de 2026 informada pelo usuário: jan=50.013, fev=46.161, mar=58.736, abr=57.326, mai=57.636, jun=55.091 — média jan-jun/2026 = 54.160,5 ≈ 54.161/mês. Indicador é 'procedimentos' (não 'atendimentos' nem 'pessoas únicas') — preservar essa terminologia. Dado NÃO verificado independentemente por esta pesquisa (sem acesso ao painel); classificado como A/oficial por vir diretamente do sistema InfoSaúde-DF, conforme informado pelo usuário. | Se o site mantiver nomenclatura própria distinta de 'UPA Sobradinho' vs 'UPA Sobradinho II', reconfirmar com a SES-DF/IgesDF que se trata de uma única unidade antes de publicar sob os dois nomes. REVISÃO (auditoria profunda, rodada 4): reexaminada a correspondência de nome — não localizada nova informação além da já registrada (usuário confirmou tratar-se da mesma unidade). MANTIDO sem alteração de valor.",
  },
  "upa-recanto-das-emas": {
    slug: "upa-recanto-das-emas",
    researchCategory: "UPA",
    referenceArea: "Recanto das Emas",
    metrics: [
      {
        type: "procedures",
        value: 62569,
        unit: "procedimentos/mês",
        raw: "62.569 procedimentos/mês (média jan-jun/2026)",
        period: "jan-jun/2026 (competência consultada: 2026/06)",
        source:
          "InfoSaúde-DF — Sala de Situação > Atenção Especializada > UPAs - Pronto Atendimento",
        sourceQuality: "A",
        estimated: false,
      },
    ],
    income: {
      value: 3226.3,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 3.226,30 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 32,
      gender: { femalePercent: 52.2, malePercent: 47.8 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "3ª RODADA: dado fornecido manualmente pelo usuário, extraído diretamente do painel InfoSaúde-DF. Série mensal de 2026 informada pelo usuário: jan=53.958, fev=52.943, mar=67.591, abr=66.385, mai=71.424, jun=63.114 — média jan-jun/2026 = 62.569,2 ≈ 62.569/mês. Indicador é 'procedimentos' (não 'atendimentos' nem 'pessoas únicas') — preservar essa terminologia. Dado NÃO verificado independentemente por esta pesquisa (sem acesso ao painel); classificado como A/oficial por vir diretamente do sistema InfoSaúde-DF, conforme informado pelo usuário. Substitui os achados anteriores (notícias sem período definido, como 'celebra 13 anos' / 'mais de 13 mil pacientes'), hoje descartados por serem muito menos úteis que este dado mensal oficial. | Dado mensal 2026 obtido pelo usuário diretamente no InfoSaúde-DF. REVISÃO (auditoria profunda, rodada 4): reexaminado — sem ambiguidade de nome/RA; nenhuma fonte adicional necessária ou encontrada. MANTIDO sem alteração.",
  },
  "hospital-regional-de-taguatinga": {
    slug: "hospital-regional-de-taguatinga",
    researchCategory: "Hospital",
    referenceArea: "Taguatinga",
    metrics: [
      {
        type: "attendances",
        value: Math.round(188_106 / 12),
        unit: "atendimentos/mês",
        raw: '188.106 atendimentos/ano — painel "Emergências Hospitalares" (competência 2025, ano completo)',
        period: "ano completo 2025",
        source: 'InfoSaúde-DF / SES-DF — painel "Emergências Hospitalares" (SIA/MS)',
        sourceQuality: "A",
        estimated: false,
        annualValue: 188_106,
      },
      {
        type: "outpatient_consultations",
        value: Math.round(260_449 / 12),
        unit: "procedimentos/mês",
        raw: '260.449 procedimentos/ano — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Consultas/atendimentos (competência 2025, ano completo). O filtro inclui códigos além de consulta convencional (acolhimento com classificação de risco, atendimento de urgência em atenção especializada, atendimento de urgência com observação, teleconsulta, consulta domiciliar etc.) — possível sobreposição com o painel de Emergências, ver notes.',
        period: "ano completo 2025",
        source:
          'InfoSaúde-DF / SES-DF — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Consultas/atendimentos (SIA/MS)',
        sourceQuality: "A",
        estimated: false,
        annualValue: 260_449,
      },
      {
        type: "procedures",
        value: Math.round(94_761 / 12),
        unit: "procedimentos/mês",
        raw: '94.761 procedimentos/ano — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Exames (competência 2025, ano completo). Procedimento ≠ visita (uma passagem pode gerar múltiplos exames) — indicador AUXILIAR de intensidade, não usado como base de circulação.',
        period: "ano completo 2025",
        source:
          'InfoSaúde-DF / SES-DF — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Exames (SIA/MS)',
        sourceQuality: "A",
        estimated: false,
        annualValue: 94_761,
      },
    ],
    income: {
      value: 6072.92,
      type: "familiar",
      typeLabel:
        "familiar média (RA, fornecida manualmente pelo usuário) — NÃO é domiciliar nem per capita",
      raw: "R$ 6.072,92 (familiar)",
      source: "Valor informado manualmente pelo usuário — ver notes",
      sourceQuality: "B",
    },
    demographics: {
      averageAge: 37.3,
      gender: { femalePercent: 54.1, malePercent: 45.9 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "ATUALIZAÇÃO (dados oficiais 2025): as 3 métricas de atividade hospitalar foram SUBSTITUÍDAS pelos números oficiais do InfoSaúde-DF/SIA-MS, competência ano completo 2025, coletados manualmente pelo cliente diretamente nos painéis com o estabelecimento selecionado — reclassificadas sourceQuality A / estimated false (dado oficial observado da atividade registrada, mesmo critério já usado para os procedimentos de UPA via InfoSaúde; a estimativa só começa quando essa atividade é transformada em impacto potencial pelo modelo, em hospital-screen.ts). VALOR ANTERIOR DESCARTADO (conflitava com o dado oficial 2025, mais recente e de fonte primária direta): 12.746 atendimentos/mês (Jornal de Brasília, 'HRT completa 50 anos...', 04/03/2024, sourceQuality B, calculado de 152.947 atendimentos de pronto-socorro em 2023 ÷ 12) — preservado aqui só para rastreabilidade histórica, não é mais o indicador ativo. AUXILIAR (não alimenta o modelo de impacto): produção ambulatorial TOTAL do estabelecimento (soma de todos os filtros de produção) = 1.069.351 procedimentos/ano ≈ 89.113/mês (SIA/MS) — ainda menos representativa de pessoas do que os filtros individuais acima, mantida aqui só como contexto de intensidade. SOBREPOSIÇÃO: 'Consultas/atendimentos' (painel de produção ambulatorial) e 'Emergências Hospitalares' são painéis distintos do SIA/MS, mas o filtro de consultas inclui códigos que também podem ocorrer na emergência (ex.: acolhimento com classificação de risco) — por isso NÃO são somados; a camada de cálculo usa o maior dos dois como piso conservador da circulação. | [Renda] ATUALIZAÇÃO (integração ao site, pós-revisão): renda FAMILIAR média de R$ 6.072,92/mês informada pelo usuário para Taguatinga, preenchendo a lacuna desta RA. Tipo 'renda familiar' preservado distintamente de 'domiciliar' e de 'per capita' — não deve ser tratado como equivalente a nenhum dos dois. O relatório PDAD 2021 existe e menciona a Seção 3.7 'Rendimento' (Tabelas A.66/A.67), mas os valores de renda domiciliar/per capita não puderam ser extraídos do PDF nesta pesquisa (documento truncado na ferramenta de leitura antes da tabela); apenas a renda média do trabalho principal havia sido capturada anteriormente: R$ 3.223,31 (indicador PARCIAL, preservado aqui como contexto histórico, não é renda domiciliar nem familiar).",
  },
  "hospital-regional-de-ceilandia": {
    slug: "hospital-regional-de-ceilandia",
    researchCategory: "Hospital",
    referenceArea: "Ceilândia",
    metrics: [
      {
        type: "attendances",
        value: Math.round(68_259 / 12),
        unit: "atendimentos/mês",
        raw: '68.259 atendimentos/ano — painel "Emergências Hospitalares" (competência 2025, ano completo)',
        period: "ano completo 2025",
        source: 'InfoSaúde-DF / SES-DF — painel "Emergências Hospitalares" (SIA/MS)',
        sourceQuality: "A",
        estimated: false,
        annualValue: 68_259,
      },
      {
        type: "outpatient_consultations",
        value: Math.round(246_758 / 12),
        unit: "procedimentos/mês",
        raw: '246.758 procedimentos/ano — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Consultas/atendimentos (competência 2025, ano completo). Inclui códigos além de consulta convencional (acolhimento com classificação de risco, atendimento de urgência em atenção especializada, atendimento de urgência com observação, teleconsulta, consulta domiciliar etc.) — possível sobreposição com o painel de Emergências, ver notes.',
        period: "ano completo 2025",
        source:
          'InfoSaúde-DF / SES-DF — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Consultas/atendimentos (SIA/MS)',
        sourceQuality: "A",
        estimated: false,
        annualValue: 246_758,
      },
      {
        type: "procedures",
        value: Math.round(87_589 / 12),
        unit: "procedimentos/mês",
        raw: '87.589 procedimentos/ano — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Exames (competência 2025, ano completo). Procedimento ≠ visita — indicador AUXILIAR de intensidade, não usado como base de circulação.',
        period: "ano completo 2025",
        source:
          'InfoSaúde-DF / SES-DF — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Exames (SIA/MS)',
        sourceQuality: "A",
        estimated: false,
        annualValue: 87_589,
      },
    ],
    income: {
      value: 4491.1,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 4.491,10 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 34.8,
      gender: { femalePercent: 52.8, malePercent: 47.2 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "ATUALIZAÇÃO (dados oficiais 2025): as 3 métricas de atividade hospitalar foram SUBSTITUÍDAS pelos números oficiais do InfoSaúde-DF/SIA-MS, competência ano completo 2025, coletados manualmente pelo cliente diretamente nos painéis com o estabelecimento selecionado — reclassificadas sourceQuality A / estimated false (dado oficial observado da atividade registrada; a estimativa só começa na conversão para impacto potencial, em hospital-screen.ts). VALOR ANTERIOR DESCARTADO (conflitava com o dado oficial 2025): 7.886 atendimentos de urgência e emergência/mês (Política Distrital, 27/08/2025, sourceQuality B, calculado de 55.200 atendimentos em jan-jul/2025, 7 meses, ÷ 7) — preservado aqui só para rastreabilidade histórica, não é mais o indicador ativo (a nova métrica de emergência cobre o ANO COMPLETO 2025, período mais amplo e consistente). AUXILIAR (não alimenta o modelo de impacto): a fonte desta atualização não trouxe produção ambulatorial TOTAL para o HRC (só os dois filtros individuais acima). SOBREPOSIÇÃO: 'Consultas/atendimentos' e 'Emergências Hospitalares' são painéis distintos do SIA/MS, mas o filtro de consultas inclui códigos que também podem ocorrer na emergência (ex.: acolhimento com classificação de risco) — por isso NÃO são somados; a camada de cálculo usa o maior dos dois como piso conservador da circulação.",
  },
  "hospital-regional-do-gama": {
    slug: "hospital-regional-do-gama",
    researchCategory: "Hospital",
    referenceArea: "Gama",
    metrics: [
      {
        type: "attendances",
        value: Math.round(248_615 / 12),
        unit: "atendimentos/mês",
        raw: '248.615 atendimentos/ano — painel "Emergências Hospitalares" (competência 2025, ano completo)',
        period: "ano completo 2025",
        source: 'InfoSaúde-DF / SES-DF — painel "Emergências Hospitalares" (SIA/MS)',
        sourceQuality: "A",
        estimated: false,
        annualValue: 248_615,
      },
      {
        type: "outpatient_consultations",
        value: Math.round(280_027 / 12),
        unit: "procedimentos/mês",
        raw: '280.027 procedimentos/ano — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Consultas/atendimentos (competência 2025, ano completo). Inclui códigos além de consulta convencional (acolhimento com classificação de risco, atendimento de urgência em atenção especializada, atendimento de urgência com observação, teleconsulta, consulta domiciliar etc.) — possível sobreposição com o painel de Emergências, ver notes.',
        period: "ano completo 2025",
        source:
          'InfoSaúde-DF / SES-DF — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Consultas/atendimentos (SIA/MS)',
        sourceQuality: "A",
        estimated: false,
        annualValue: 280_027,
      },
      {
        type: "procedures",
        value: Math.round(117_839 / 12),
        unit: "procedimentos/mês",
        raw: '117.839 procedimentos/ano — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Exames (competência 2025, ano completo). Procedimento ≠ visita — indicador AUXILIAR de intensidade, não usado como base de circulação.',
        period: "ano completo 2025",
        source:
          'InfoSaúde-DF / SES-DF — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Exames (SIA/MS)',
        sourceQuality: "A",
        estimated: false,
        annualValue: 117_839,
      },
    ],
    income: {
      value: 5034.4,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 5.034,40 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 36.1,
      gender: { femalePercent: 53, malePercent: 47 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "ATUALIZAÇÃO (dados oficiais 2025): as 3 métricas de atividade hospitalar foram SUBSTITUÍDAS pelos números oficiais do InfoSaúde-DF/SIA-MS, competência ano completo 2025, coletados manualmente pelo cliente diretamente nos painéis com o estabelecimento selecionado — reclassificadas sourceQuality A / estimated false (dado oficial observado da atividade registrada; a estimativa só começa na conversão para impacto potencial, em hospital-screen.ts). VALOR ANTERIOR DESCARTADO (era só uma faixa aproximada sem fonte documentada, agora substituída por dado oficial e datado): 12.500 atendimentos/mês (estimativa, ponto médio de uma faixa de 10.000-15.000 informada manualmente pelo usuário na 3ª rodada, sem URL/documento, sourceQuality B, estimated=true) — preservado aqui só para rastreabilidade histórica, não é mais o indicador ativo. Coincidência: o novo valor oficial de emergências (≈20.718/mês) e o de consultas (≈23.336/mês) ficam ACIMA da faixa antiga (10.000-15.000) — reforça que a faixa aproximada anterior estava subestimando a atividade real do hospital. AUXILIAR (não alimenta o modelo de impacto): a fonte desta atualização não trouxe produção ambulatorial TOTAL para o HRG (só os dois filtros individuais acima). SOBREPOSIÇÃO: 'Consultas/atendimentos' e 'Emergências Hospitalares' são painéis distintos do SIA/MS, mas o filtro de consultas inclui códigos que também podem ocorrer na emergência (ex.: acolhimento com classificação de risco) — por isso NÃO são somados; a camada de cálculo usa o maior dos dois como piso conservador da circulação.",
  },
  "hospital-regional-de-santa-maria": {
    slug: "hospital-regional-de-santa-maria",
    researchCategory: "Hospital",
    referenceArea: "Santa Maria",
    metrics: [
      {
        type: "attendances",
        value: Math.round(253_037 / 12),
        unit: "atendimentos/mês",
        raw: '253.037 atendimentos/ano — painel "Emergências Hospitalares" (competência 2025, ano completo)',
        period: "ano completo 2025",
        source: 'InfoSaúde-DF / SES-DF — painel "Emergências Hospitalares" (SIA/MS)',
        sourceQuality: "A",
        estimated: false,
        annualValue: 253_037,
      },
      {
        type: "outpatient_consultations",
        value: Math.round(364_745 / 12),
        unit: "procedimentos/mês",
        raw: '364.745 procedimentos/ano — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Consultas/atendimentos (competência 2025, ano completo). Inclui códigos além de consulta convencional (acolhimento com classificação de risco, atendimento de urgência em atenção especializada, atendimento de urgência com observação, teleconsulta, consulta domiciliar etc.) — possível sobreposição com o painel de Emergências, ver notes.',
        period: "ano completo 2025",
        source:
          'InfoSaúde-DF / SES-DF — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Consultas/atendimentos (SIA/MS)',
        sourceQuality: "A",
        estimated: false,
        annualValue: 364_745,
      },
      {
        type: "procedures",
        value: Math.round(179_597 / 12),
        unit: "procedimentos/mês",
        raw: '179.597 procedimentos/ano — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Exames (competência 2025, ano completo). Procedimento ≠ visita — indicador AUXILIAR de intensidade, não usado como base de circulação.',
        period: "ano completo 2025",
        source:
          'InfoSaúde-DF / SES-DF — painel "Produção ambulatorial dos estabelecimentos da SES-DF", filtro Exames (SIA/MS)',
        sourceQuality: "A",
        estimated: false,
        annualValue: 179_597,
      },
    ],
    income: {
      value: 3813.9,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 3.813,90 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 33.1,
      gender: { femalePercent: 52.5, malePercent: 47.5 },
    },
    averageDwellTime: "1 hora ou mais (categoria UPAs/Hospitais, Mídia Kit MOBTV)",
    targetAudience: "Pacientes e acompanhantes (categoria)",
    consumptionProfile:
      "Planos de saúde, farmácias, seguros, alimentação saudável, serviços financeiros (categoria)",
    publicationReadiness: "A",
    historicalConfidence: "A",
    notes:
      "ATUALIZAÇÃO (dados oficiais 2025): as 3 métricas de atividade hospitalar foram SUBSTITUÍDAS pelos números oficiais do InfoSaúde-DF/SIA-MS, competência ano completo 2025, coletados manualmente pelo cliente diretamente nos painéis com o estabelecimento selecionado — reclassificadas sourceQuality A / estimated false (dado oficial observado da atividade registrada; a estimativa só começa na conversão para impacto potencial, em hospital-screen.ts). Isso RESOLVE a lacuna histórica registrada abaixo: agora existe indicador de emergência/pronto-socorro GERAL (adulto) para o HRSM, algo que 4 rodadas de pesquisa anteriores não haviam localizado. VALOR ANTERIOR DESCARTADO (indicador PARCIAL, só ambulatório, não comparável ao volume total do hospital): 5.000 consultas ambulatoriais/mês (Agência Brasília, outubro/2024, sourceQuality B) — preservado aqui só para rastreabilidade histórica, não é mais o indicador ativo; o novo valor de consultas/atendimentos oficial (≈30.395/mês) é ~6× maior porque cobre um filtro mais amplo do painel de produção ambulatorial, não porque o hospital mudou de porte. HISTÓRICO (preservado): também havia sido localizado um indicador de '32.385 atendimentos no Pronto-Socorro Infantil (PSI) em 2025' (≈2.699/mês), Jornal de Brasília, 09/02/2026 — PRONTO-SOCORRO PEDIÁTRICO apenas, não comparável ao indicador geral de emergências agora disponível; não usado nesta atualização. AUXILIAR (não alimenta o modelo de impacto): a fonte desta atualização não trouxe produção ambulatorial TOTAL para o HRSM (só os dois filtros individuais acima). SOBREPOSIÇÃO: 'Consultas/atendimentos' e 'Emergências Hospitalares' são painéis distintos do SIA/MS, mas o filtro de consultas inclui códigos que também podem ocorrer na emergência (ex.: acolhimento com classificação de risco) — por isso NÃO são somados; a camada de cálculo usa o maior dos dois como piso conservador da circulação.",
  },
  "feira-do-guara": {
    slug: "feira-do-guara",
    researchCategory: "Feira",
    referenceArea: "Guará",
    metrics: [
      {
        type: "estimated_visitors",
        value: 120000,
        unit: "pessoas/mês (estimado)",
        raw: "120.000 pessoas/mês (estimativa, derivada de ~30.000 pessoas/semana)",
        period: "3ª rodada — padronização mensal de estimativa semanal, sem ano-base confirmado",
        source:
          "Estimativa fornecida manualmente pelo usuário (~30.000 pessoas/semana), padronizada para base mensal (×4)",
        sourceQuality: "B",
        estimated: true,
      },
    ],
    income: {
      value: 7979.0,
      type: "domiciliar",
      typeLabel: "domiciliar média (RA, PDAD 2021)",
      raw: "R$ 7.979,00 (domiciliar)",
      source: "PDAD-DF 2021 (Codeplan)",
      sourceQuality: "A",
    },
    demographics: {
      averageAge: 38.1,
      gender: { femalePercent: 54.4, malePercent: 45.6 },
    },
    averageDwellTime: undefined,
    targetAudience: undefined,
    consumptionProfile: undefined,
    publicationReadiness: "B",
    historicalConfidence: "D",
    notes:
      "3ª RODADA: valor fornecido manualmente pelo usuário — '≈30.000 pessoas/semana', padronizado para '≈120.000 pessoas/mês' (30.000 × 4). CADASTRADO EXPLICITAMENTE COMO ESTIMATIVA DE FLUXO MENSAL, NÃO como contagem auditada — não deve ser apresentado no site como dado estatístico oficial. É consistente em ordem de grandeza com o achado das rodadas anteriores (estimativa de 2009, Wikipédia/Tribuna do Brasil: 30.000 pessoas por ciclo de quinta-a-domingo, que geraria ~130.000/mês se extrapolado com 4,3 ciclos/mês) — o usuário optou pela padronização mais simples (×4 semanas) em vez da extrapolação por número exato de ciclos. O Mídia Kit MOBTV também menciona a Feira do Guará dentro de uma lista agregada e não desagregada de 5 feiras do DF ('fluxo mensal de mais de 1,2 milhão de pessoas' para o CONJUNTO das 5 feiras) — não deve ser usado como dado específico deste ponto. REVISÃO (auditoria profunda, rodada 4): confirmado que a iniciativa de 'monitoramento eletrônico com uso de inteligência artificial' anunciada em abril/2026 ainda não havia sido implantada na data da reportagem ('ganhará nas próximas semanas') e nenhuma nova busca encontrou dados de fluxo publicados após a implantação. Nenhuma fonte A ou B alternativa foi localizada para substituir esta estimativa. Mantido sem alteração. | Valor cadastrado como estimated=true, qualidade B (estimativa publicada/derivada de informação documentada). Confirmado na auditoria profunda (rodada 4) que o monitoramento por IA anunciado para 2026 ainda não publicou dados de fluxo. Recomenda-se acompanhar essa iniciativa para uma fonte auditada futura.",
  },
};

/** Busca a camada de audiência/pesquisa de um ponto pelo slug. Retorna undefined para os 19 pontos fora do escopo (sem Tela/LED) ou qualquer slug inexistente. */
export function getPointAudienceData(slug: string): PointAudienceData | undefined {
  return pointAudienceData[slug];
}

/** Busca uma métrica específica dentro de um registro de audiência — nunca soma/converte tipos diferentes. */
export function getPointMetric(data: PointAudienceData, type: MetricType): PointMetric | undefined {
  return data.metrics.find((metric) => metric.type === type);
}

export type PointWithAudienceData = PointWithCategory & {
  /** Ausente para pontos fora do escopo desta camada (sem Tela/LED). */
  audienceData?: PointAudienceData;
};

/**
 * Combina a identidade do ponto (network-points.ts, via findPointBySlug) com
 * a camada de audiência/pesquisa (pointAudienceData) — sem duplicar nenhum
 * campo entre as duas fontes. Uso futuro por Home, Planejador, /ponto/$slug
 * e qualquer outra página que precise das duas fontes ao mesmo tempo.
 */
export function getPointWithAudienceData(slug: string): PointWithAudienceData | undefined {
  const found = findPointBySlug(slug);
  if (!found) return undefined;
  return { ...found, audienceData: pointAudienceData[slug] };
}

/** Rótulo de exibição por tipo de métrica — nunca genérico "Pessoas/mês" para indicadores que não são isso. */
const METRIC_TYPE_LABELS: Record<MetricType, string> = {
  audited_impacts: "Impactos/mês",
  passengers: "Passageiros/mês",
  attendances: "Atendimentos/mês",
  procedures: "Procedimentos/mês",
  outpatient_consultations: "Consultas/mês",
  estimated_visitors: "Pessoas/mês (estimado)",
};

export function getMetricLabel(type: MetricType): string {
  return METRIC_TYPE_LABELS[type];
}

/** Rótulo de exibição por tipo de renda — domiciliar, familiar e per capita nunca compartilham rótulo. */
const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  domiciliar: "Renda média domiciliar",
  familiar: "Renda média familiar",
  per_capita: "Renda per capita",
};

export function getIncomeLabel(type: IncomeType): string {
  return INCOME_TYPE_LABELS[type];
}

/**
 * Métrica priorizada para o card comercial principal de um ponto:
 * impactos auditados (Datavision/Mídia Kit) > passageiros > primeira métrica
 * disponível. Todo registro de `pointAudienceData` tem pelo menos 1 métrica
 * (ver `point-audience-data.test.ts`), então isto nunca retorna undefined
 * para um `data` válido.
 */
export function getPrimaryMetric(data: PointAudienceData): PointMetric {
  return (
    data.metrics.find((metric) => metric.type === "audited_impacts") ??
    data.metrics.find((metric) => metric.type === "passengers") ??
    data.metrics[0]
  );
}
