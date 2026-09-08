import type { MethodologyNote } from "./types.ts";

/** Hipóteses preliminares MOBTV, não medições. Recalibrar com validação de campo. */
const DEFAULT_ASSUMPTIONS = {
  /** Hipótese de presença/acompanhantes associada à atividade assistencial. */
  presenceFactor: 1.25,
  /** Hipótese de exposição/visibilidade da tela. */
  exposureFactor: 0.8,
  /** Hipótese de frequência média de oportunidades de visualização. */
  effectiveExposureFrequency: 2,
} as const;

// Configurações separadas permitem recalibrar cada contexto neste único arquivo.
export const HEALTHCARE_SCREEN_MODELS = {
  upa: { ...DEFAULT_ASSUMPTIONS },
  hospital: { ...DEFAULT_ASSUMPTIONS },
} as const;

export function healthcareMethodology(
  context: keyof typeof HEALTHCARE_SCREEN_MODELS,
): MethodologyNote {
  const model = HEALTHCARE_SCREEN_MODELS[context];
  const number = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  const base =
    context === "upa"
      ? "procedimentos/mês"
      : "atividade/mês (maior entre emergências e consultas/atendimentos, nunca a soma)";
  return {
    modelConfidence: "preliminary",
    summary:
      "Estimativa preliminar MOBTV sobre dados oficiais de atividade assistencial do InfoSaúde. " +
      "Considera hipóteses de presença/acompanhantes, exposição à tela e oportunidades de visualização. " +
      "Representa impactos potenciais, não pessoas únicas nem circulação medida. Os fatores ainda estão em validação.",
    formula:
      `Impactos potenciais estimados/mês = ${base} × ${number(model.presenceFactor)} ` +
      `(hipótese de presença/acompanhantes) × ${number(model.exposureFactor)} ` +
      `(hipótese de visibilidade) × ${number(model.effectiveExposureFrequency)} ` +
      "(hipótese de frequência de oportunidades de exposição). Parâmetros do modelo, não dados medidos.",
  };
}
