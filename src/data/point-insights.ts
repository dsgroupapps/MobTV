/**
 * Insights/demografia por ponto — para a página de perfil acessada via QR
 * Code (`/ponto/$slug`). Estrutura separada de `network-points.ts` de
 * propósito: nome, categoria, mídia, foto e localização continuam vindo de
 * lá (fonte única); aqui só ficam os campos que network-points.ts nunca
 * teve — audiência, demografia e indicadores extras do ponto.
 *
 * NENHUM dado deste arquivo é oficial por padrão. `isDemo: true` sinaliza
 * que os números são fictícios — a página usa essa flag para exibir o
 * aviso "dados demonstrativos" e para nunca tratar esses valores como
 * reais. Quando a MOBTV fornecer números reais por ponto, o registro
 * correspondente deve trocar para `isDemo: false` e os campos passam a
 * ser exibidos como dado oficial — a UI não muda, só o conteúdo.
 *
 * Todo campo é opcional de propósito: nem todo ponto vai ter todo
 * indicador disponível. A página esconde qualquer card/seção cujo dado
 * não exista, em vez de mostrar card vazio, "0", "-" ou "N/D" — ver
 * `PointProfile.tsx`.
 *
 * PARA INSERIR DADOS REAIS DE UM PONTO:
 * adicione (ou edite) uma entrada em `pointInsights` abaixo, com a chave
 * igual ao slug do ponto (o mesmo usado em /ponto/$slug — ver
 * `src/lib/point-slug.ts`), e marque `isDemo: false`. Preencha somente os
 * campos para os quais você tem dado real; deixe os demais ausentes.
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

export const pointInsights: Record<string, PointInsights> = {
  // DEMONSTRATIVO — números ilustrativos, aguardando dado real da MOBTV.
  // Ao substituir por dado real, troque isDemo para false.
  "hospital-regional-de-santa-maria": {
    slug: "hospital-regional-de-santa-maria",
    isDemo: true,
    monthlyAudience: 85_000,
    audience: {
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
  },
};

export function getPointInsights(slug: string): PointInsights | undefined {
  return pointInsights[slug];
}
