import type {
  IncomeType,
  MetricType,
  ResearchCategory,
} from "../../../data/point-audience-data.ts";
import type { MediaTypeKey } from "../../../data/network-points.ts";

/**
 * Camada de INTELIGÊNCIA DE AUDIÊNCIA do planejador público.
 *
 * NÃO é uma nova fonte de dados. É uma camada de LEITURA/CÁLCULO por tipo de
 * mídia, montada em cima de `src/data/point-audience-data.ts` (a estrutura
 * tipada e centralizada de métricas por ponto, chaveada por slug — que já
 * existe e não é duplicada aqui).
 *
 * Estratégias implementadas:
 *  - `Painel LED`  → `led.ts`    (métrica principal = impactos auditados Datavision, medida)
 *  - `Tela` (UPAs) → `screen.ts` (métrica principal = impactos potenciais MODELADOS
 *                                 sobre procedimentos/mês; a base medida fica em `baseMetric`)
 *  - `WiFi Ads`    → ainda não implementada (dispatcher retorna `null`)
 *
 * REGRA: nada aqui inventa número. Campo ausente na fonte → ausente aqui
 * (`undefined`), nunca `0` nem um valor derivado sem base.
 */

/**
 * Qualidade/confiança interna de uma métrica — não é exibida como letra ao
 * cliente, mas a aplicação diferencia os três níveis:
 *  - `measured`  = fluxo/impacto medido e auditado, fonte primária (ex.: impactos Datavision, procedimentos InfoSaúde).
 *  - `derived`   = estimativa documentada, fonte secundária, ou valor derivado por modelo (ex.: impactos potenciais de Tela).
 *  - `estimated` = estimativa sem fonte primária.
 */
export type AudienceConfidenceTier = "measured" | "derived" | "estimated";

/**
 * Vocabulário de métricas exibíveis. `MetricType` são as métricas MEDIDAS da
 * fonte (`point-audience-data.ts`); `"modeled_impressions"` é a métrica
 * DERIVADA por modelo de mídia (Tela/UPA) — nunca somada com as medidas.
 */
export type MetricKind = MetricType | "modeled_impressions";

/** Métrica mensal de um ponto, já normalizada para exibição comercial. */
export type MonthlyAudienceMetric = {
  value: number;
  /** Tipo preservado da fonte, ou `"modeled_impressions"` quando é derivado por modelo. Nunca "pessoas". */
  metricType: MetricKind;
  /** Rótulo pt-BR com unidade: "impactos/mês", "procedimentos/mês", "impactos potenciais/mês", ... */
  label: string;
  /** Substantivo minúsculo para copy inline: "impactos", "procedimentos", "impactos potenciais", ... */
  noun: string;
  /** Ano/competência quando a fonte informa. */
  period?: string;
  source: string;
  tier: AudienceConfidenceTier;
  /** true quando a própria fonte marcou o valor como estimativa, ou quando é modelado. */
  estimated: boolean;
};

/** Explicação "Como calculamos?" de uma métrica derivada por modelo. */
export type MethodologyNote = {
  /** Texto curto para tooltip/nota na UI — sem expor os coeficientes. */
  summary: string;
  /** Fórmula completa, com coeficientes — para transparência (código + tooltip avançado). */
  formula: string;
};

/**
 * Inteligência de audiência de um ponto para uma mídia específica.
 * (Mesma forma para `Painel LED` e `Tela` — a diferença está em `mediaType`,
 * em `baseMetric` e em `methodology`.)
 */
export type PointIntelligence = {
  slug: string;
  /** Mídia que produziu esta inteligência (`"led"` | `"screen"`). */
  mediaType: MediaTypeKey;
  /** Categoria de pesquisa crua ("Metrô" | "BRT" | "UPA" | ...). */
  researchCategory: ResearchCategory;
  /** Rótulo de ambiente para copy: "Metrô", "Terminal BRT", "UPA", ... */
  environmentLabel: string;
  referenceArea?: string;
  /**
   * Métrica principal exibida como número grande. Para `Painel LED` é a
   * medição auditada; para `Tela` é a estimativa MODELADA. Ausente quando o
   * ponto tem a mídia mas ainda não há dado base (ver seção "dados ausentes").
   */
  monthly?: MonthlyAudienceMetric;
  /**
   * Métrica MEDIDA que embasa `monthly` quando `monthly` é derivado
   * (ex.: procedimentos/mês para a Tela). Ausente para `Painel LED`
   * (lá `monthly` já é a medição).
   */
  baseMetric?: MonthlyAudienceMetric;
  /** Média diária de REFERÊNCIA: `monthly.value / 30`. Referência de ordem de grandeza — não é entrega diária. */
  dailyReference?: { value: number };
  /** "Como calculamos?" — presente só quando `monthly` é uma estimativa modelada. */
  methodology?: MethodologyNote;
  /** Demografia — específica do ponto (varia por local). */
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
  /**
   * true quando `behavior` (permanência, perfil, interesses) é uma
   * caracterização de CATEGORIA (inventário UPA/Hospital MOBTV), não medição
   * do ponto. `demographics` continua sendo do ponto.
   */
  profileIsCategoryLevel?: boolean;
};

/** @deprecated Use `PointIntelligence`. Mantido por compatibilidade. */
export type LedPointIntelligence = PointIntelligence;

/** Agregado de uma métrica compatível entre vários pontos (nunca soma tipos distintos). */
export type CampaignMetricGroup = {
  metricType: MetricKind;
  label: string;
  noun: string;
  total: number;
  /** Pior nível de confiança entre os pontos que compõem o grupo. */
  tier: AudienceConfidenceTier;
  pointCount: number;
  pointNames: string[];
};

/** Visão resumida da campanha considerando os pontos com inteligência de audiência (LED e/ou Tela). */
export type CampaignAudienceRollup = {
  /** Nº de pontos da seleção que têm inteligência de audiência (LED ou Tela). */
  ledPointCount: number;
  points: { slug: string; name: string; intelligence: PointIntelligence }[];
  /**
   * Métricas agregadas — uma entrada por TIPO de métrica. Tipos diferentes
   * (impactos auditados Datavision x impactos potenciais modelados x fluxo x
   * procedimentos) NUNCA são somados: aparecem como grupos separados.
   */
  metricGroups: CampaignMetricGroup[];
  /** Ambientes distintos presentes na seleção, na ordem de entrada. */
  environments: string[];
  /** "Metrô + UPA" */
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

/** Potencial de exposição do ambiente para UM grupo de métrica, ao longo da campanha. */
export type CampaignPotentialGroup = {
  metricType: MetricKind;
  /** "impactos/mês", "impactos potenciais/mês", ... */
  label: string;
  noun: string;
  tier: AudienceConfidenceTier;
  pointCount: number;
  /** Σ mensal do grupo. */
  monthly: number;
  /** Σ mensal ÷ 30. */
  dailyReference: number;
  /** Σ mensal × (days / 30) — potencial na janela; NÃO é a entrega da campanha. */
  windowPotential: number;
};

export type CampaignSimResult = {
  days: number;
  insertionsPerDay: number;
  /** `days * insertionsPerDay`. */
  totalInsertions: number;
  /** Um bloco por grupo de métrica presente na seleção — nunca somados entre si. */
  potentialGroups: CampaignPotentialGroup[];
  /**
   * Impactos ESTIMADOS entregues pela campanha (após aplicar share de exibição).
   * Só é preenchido quando existe metodologia defensável. Nesta fase é sempre
   * `null` — falta a variável descrita em `missingVariable`.
   */
  campaignImpacts: number | null;
  /** Nome exato da variável que falta para calcular `campaignImpacts`. */
  missingVariable: string | null;
};

/**
 * Parâmetros que ligam a audiência/potencial de um ponto a uma quantidade de
 * inserções (share de exibição). NENHUM ponto tem esse modelo hoje — o Media
 * Kit / rate card não publica loop, duração de spot, nº de anunciantes no
 * loop nem total de inserções/dia. Quando a MOBTV fornecer, preencher o
 * registro correspondente e a estimativa passa a ser calculada.
 */
export type LedCampaignModel = {
  /** Total de inserções/dia que o loop do painel executa (denominador do share de exibição). */
  loopInsertionsPerDay: number;
  /** Descrição da metodologia/fonte. */
  methodology: string;
};

export type PlannerMediaType = MediaTypeKey;
