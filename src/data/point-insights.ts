/**
 * Indicadores complementares legados por ponto. Conteúdo isDemo é sempre
 * excluído da publicação por publicPointProfile, mesmo na ausência de dados.
 * A base real centralizada em point-audience-data.ts tem prioridade integral.
 */

export type AgeBracket = {
  label: string;
  percent: number;
};

export type AudienceProfile = {
  /** Distribuição percentual por faixa etária, para o gráfico de barras. */
  ageBrackets?: AgeBracket[];
  femalePercent?: number;
  malePercent?: number;
};

/** Indicador extra e opcional (ex.: impactos mensais, tempo médio de permanência, horário de pico). */
export type AdditionalMetric = {
  label: string;
  value: string;
};

export type PointInsights = {
  /** Slug do ponto (mesmo usado na URL /ponto/$slug), só para depuração/lookup reverso. */
  slug: string;
  /** true = todo dado abaixo é fictício/ilustrativo, não oficial. */
  isDemo: boolean;
  /** Pessoas/mês — card principal 1. */
  monthlyAudience?: number;
  /** Renda média familiar do entorno, em R$ — card principal 2. */
  averageFamilyIncome?: number;
  audience?: AudienceProfile;
  /**
   * Indicadores extras opcionais, além dos dois cards principais e do perfil de audiência.
   * NÃO renderizado em PointProfile.tsx no momento — seção "Outros indicadores" foi
   * removida da UI a pedido, mas o campo continua aqui para não perder o dado quando
   * a seção voltar.
   */
  additionalMetrics?: AdditionalMetric[];
};

// Sem perfis demonstrativos publicados. HRSM usa point-audience-data.ts.
export const pointInsights: Record<string, PointInsights> = {};

export function getPointInsights(slug: string): PointInsights | undefined {
  return pointInsights[slug];
}
