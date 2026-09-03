import type {
  IncomeType,
  MetricType,
  PointMetric,
  ResearchCategory,
} from "../../../data/point-audience-data.ts";
import type { MediaTypeKey } from "../../../data/network-points.ts";

/**
 * Camada de INTELIGÊNCIA DE AUDIÊNCIA do planejador público.
 *
 * NÃO é uma nova fonte de dados. É uma camada de LEITURA/CÁLCULO por tipo de
 * mídia, montada em cima de `src/data/point-audience-data.ts` (a estrutura
 * tipada e centralizada de métricas por ponto, chaveada por slug — que já
 * existe e não é duplicada aqui). Esta fase implementa SOMENTE a estratégia
 * de `Painel LED`; `screen` e `wifi` ficam preparados no dispatcher
 * (`getPointIntelligence`) mas retornam `null`.
 *
 * REGRA: nada aqui inventa número. Campo ausente na fonte → ausente aqui
 * (`undefined`), nunca `0` nem um valor derivado sem base.
 */

/**
 * Qualidade/confiança interna de uma métrica — não é exibida como letra ao
 * cliente, mas a aplicação diferencia os três níveis (importante quando
 * Tela e WiFi entrarem):
 *  - `measured`  = impacto/fluxo medido e auditado, fonte primária (ex.: impactos Datavision).
 *  - `derived`   = estimativa documentada, fonte secundária, ou valor derivado (ex.: média mensal ÷ 30).
 *  - `estimated` = estimativa sem fonte primária.
 */
export type AudienceConfidenceTier = "measured" | "derived" | "estimated";

/** Métrica mensal de um ponto, já normalizada para exibição comercial. */
export type MonthlyAudienceMetric = {
  value: number;
  /** Tipo original preservado da planilha — nunca renomeado para "pessoas". */
  metricType: MetricType;
  /** Rótulo pt-BR com unidade: "impactos/mês", "passageiros/mês", ... */
  label: string;
  /** Substantivo minúsculo para copy inline: "impactos", "passageiros", ... */
  noun: string;
  /** Ano/competência quando a fonte informa. */
  period?: string;
  source: string;
  tier: AudienceConfidenceTier;
  /** true quando a própria fonte marcou o valor como estimativa. */
  estimated: boolean;
};

/** Inteligência de audiência de um ponto para a mídia `Painel LED`. */
export type LedPointIntelligence = {
  slug: string;
  /** Categoria de pesquisa crua ("Metrô" | "BRT" | ...). */
  researchCategory: ResearchCategory;
  /** Rótulo de ambiente para copy: "Metrô", "Terminal BRT", ... */
  environmentLabel: string;
  referenceArea?: string;
  /** Métrica mensal principal do Painel LED — sempre impactos auditados (Datavision). */
  monthly: MonthlyAudienceMetric;
  /**
   * Média diária de REFERÊNCIA: `monthly.value / 30`. É só uma referência de
   * ordem de grandeza do ambiente — NÃO é "entrega diária da campanha".
   */
  dailyReference: { value: number };
  demographics?: {
    averageAge?: number;
    genderFemalePercent?: number;
    genderMalePercent?: number;
    income?: {
      value: number;
      /** "Renda média domiciliar" | "Renda média familiar" | "Renda per capita" */
      label: string;
      type: IncomeType;
      /** Texto completo de atribuição territorial/ano, quando houver. */
      typeLabel: string;
    };
  };
  behavior?: {
    /** Tempo médio de permanência, sem o sufixo de categoria. */
    dwellTime?: string;
    /** Frase de perfil da audiência ("PERFIL"). */
    audienceProfile?: string;
    /** Categorias de consumo/interesse ("INTERESSES"). */
    consumptionCategories?: string[];
  };
};

/** Agregado de uma métrica compatível entre vários pontos (nunca soma tipos distintos). */
export type CampaignMetricGroup = {
  metricType: MetricType;
  label: string;
  noun: string;
  total: number;
  /** Pior nível de confiança entre os pontos que compõem o grupo. */
  tier: AudienceConfidenceTier;
  pointCount: number;
  pointNames: string[];
};

/** Visão resumida da campanha considerando só os pontos com `Painel LED`. */
export type CampaignAudienceRollup = {
  ledPointCount: number;
  points: { slug: string; name: string; intelligence: LedPointIntelligence }[];
  /**
   * Métricas agregadas — uma entrada por TIPO de métrica. Métricas de tipos
   * diferentes (ex.: impactos auditados x fluxo de passageiros) nunca são
   * somadas: aparecem como grupos separados.
   */
  metricGroups: CampaignMetricGroup[];
  /** Ambientes distintos presentes na seleção, na ordem de entrada. */
  environments: string[];
  /** "Metrô + Terminal BRT" */
  environmentsLabel: string;
  /** Média simples das idades médias disponíveis (rótulo "média", aproximado). */
  averageAge?: number;
  /** Média simples dos splits de gênero disponíveis (aproximado). */
  gender?: { femalePercent: number; malePercent: number };
  /** Faixa de renda — só quando TODOS os pontos com renda usam o mesmo tipo. */
  income?: { min: number; max: number; type: IncomeType; label: string };
  /** true quando há pontos com renda mas de tipos diferentes (não combináveis). */
  incomeTypesMixed: boolean;
};

export type CampaignSimInput = {
  /** Duração da campanha em dias (inteiro). */
  days: number;
  /** Inserções por dia (inteiro). */
  insertionsPerDay: number;
};

export type CampaignSimResult = {
  days: number;
  insertionsPerDay: number;
  /** `days * insertionsPerDay`. */
  totalInsertions: number;
  /** Σ das métricas mensais auditadas dos pontos LED — potencial mensal do ambiente. */
  monthlyEnvironmentPotential: number | null;
  /** Σ (mensal ÷ 30) — média diária de referência do ambiente. */
  dailyReference: number | null;
  /**
   * Σ mensal × (days / 30) — potencial de EXPOSIÇÃO do ambiente na janela da
   * campanha. É a métrica auditada proporcional ao tempo, NÃO a entrega
   * garantida da campanha (que depende do share de exibição).
   */
  windowEnvironmentPotential: number | null;
  /**
   * Impactos ESTIMADOS entregues pela campanha. Só é preenchido quando existe
   * metodologia defensável (ver `ledCampaignModels`). Nesta fase é sempre
   * `null` — falta a variável descrita em `missingVariable`.
   */
  campaignImpacts: number | null;
  /** Nome exato da variável que falta para calcular `campaignImpacts`. */
  missingVariable: string | null;
};

/**
 * Parâmetros que ligam a audiência auditada do painel a uma quantidade de
 * inserções. NENHUM ponto tem esse modelo hoje — o Media Kit / rate card não
 * publica loop, faces ativas, duração de spot nem share de exibição. Quando a
 * MOBTV fornecer, preencher `ledCampaignModels[slug]` e a estimativa passa a
 * ser calculada automaticamente (ver `estimateLedCampaignImpacts`).
 */
export type LedCampaignModel = {
  /** Total de inserções/dia que o loop do painel executa (denominador do share de exibição). */
  loopInsertionsPerDay: number;
  /** Descrição da metodologia/fonte, exibida no código e opcionalmente na UI. */
  methodology: string;
};

export type PlannerMediaType = MediaTypeKey;
