/**
 * As 4 peças oficiais de demonstração dos formatos de mídia estática MOBTV —
 * todas com placeholder "SUA MARCA AQUI"/"SUA MÍDIA AQUI". São simulações de
 * aplicação, não campanhas reais executadas por nenhuma marca. Fonte única
 * de imagem usada em /midia, / (Home) e /sobre — trocar aqui propaga para
 * as três rotas.
 */
export type MediaFormatKey =
  | "envelopamento"
  | "midia-interna"
  | "adesivacao-catracas"
  | "painel-estatico";

export type MediaFormatExample = {
  key: MediaFormatKey;
  title: string;
  image: string;
  /** object-position ajustado individualmente ao elemento publicitário de cada imagem. */
  objectPosition: string;
};

export const mediaFormatExamples: MediaFormatExample[] = [
  {
    key: "envelopamento",
    title: "Envelopamento de Vagão",
    image: "/envelopamento_vagao.png",
    objectPosition: "22% 62%",
  },
  {
    key: "midia-interna",
    title: "Mídia Interna",
    image: "/midia_interna_vagao.png",
    objectPosition: "40% 38%",
  },
  {
    key: "adesivacao-catracas",
    title: "Adesivação de Catracas",
    image: "/adesivacao_catracas.png",
    objectPosition: "62% 38%",
  },
  {
    key: "painel-estatico",
    title: "Painel Estático",
    image: "/painel_estatico.png",
    objectPosition: "50% 40%",
  },
];

export function mediaFormatExample(key: MediaFormatKey): MediaFormatExample {
  return mediaFormatExamples.find((m) => m.key === key)!;
}
