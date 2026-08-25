/**
 * Insights/demografia por ponto — para a página de perfil acessada via QR
 * Code (`/ponto/$slug`). Estrutura separada de `network-points.ts` de
 * propósito: nome, categoria, mídia, foto e localização continuam vindo de
 * lá (fonte única); aqui só ficam os campos que network-points.ts nunca
 * teve — demografia de audiência e métricas de fluxo/impacto do ponto.
 *
 * NENHUM dado deste arquivo é oficial. `isDemo: true` sinaliza que os
 * números são fictícios — a página usa essa flag para exibir o aviso
 * "dados demonstrativos" e para nunca tratar esses valores como reais.
 * Quando a MOBTV fornecer números reais por ponto, o registro correspondente
 * deve trocar para `isDemo: false` e os campos passam a ser exibidos como
 * dado oficial — a UI não muda, só o conteúdo.
 *
 * Todo campo é opcional de propósito: a página esconde qualquer indicador/
 * seção cujo dado não exista, em vez de mostrar card vazio ou "0" — ver
 * `PointProfile.tsx`.
 */

export type AgeBracket = {
  label: string;
  percent: number;
};

export type AudienceProfile = {
  /** Faixa etária predominante, para o card de destaque (ex.: "27–54 anos"). */
  dominantAgeRange?: string;
  /** Distribuição completa por faixa etária, para o gráfico de barras. */
  ageBrackets?: AgeBracket[];
  femalePercent?: number;
  malePercent?: number;
};

export type PointMetrics = {
  monthlyFlow?: number;
  monthlyImpacts?: number;
  avgDwellMinutes?: number;
  /** Texto livre — ex.: "08h–11h". */
  peakHours?: string;
};

export type PointInsights = {
  /** Slug do ponto (mesmo usado na URL /ponto/$slug), só para depuração/lookup reverso. */
  slug: string;
  /** true = todo dado abaixo é fictício/ilustrativo, não oficial. */
  isDemo: boolean;
  audience?: AudienceProfile;
  metrics?: PointMetrics;
};

export const pointInsights: Record<string, PointInsights> = {
  "hospital-regional-de-santa-maria": {
    slug: "hospital-regional-de-santa-maria",
    isDemo: true,
    audience: {
      dominantAgeRange: "27–54 anos",
      ageBrackets: [
        { label: "18–24", percent: 14 },
        { label: "25–34", percent: 29 },
        { label: "35–44", percent: 27 },
        { label: "45–54", percent: 18 },
        { label: "55+", percent: 12 },
      ],
      femalePercent: 52,
      malePercent: 48,
    },
    metrics: {
      monthlyFlow: 85_000,
      monthlyImpacts: 120_000,
      avgDwellMinutes: 38,
      peakHours: "08h–11h",
    },
  },
};

export function getPointInsights(slug: string): PointInsights | undefined {
  return pointInsights[slug];
}
