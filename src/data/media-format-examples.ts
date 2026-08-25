/**
 * Exemplos visuais dos formatos comerciais MOBTV. As peças com "SUA MARCA
 * AQUI"/"SUA MÍDIA AQUI" são simulações de aplicação, não campanhas reais
 * executadas por nenhuma marca. A ordem abaixo reflete a prioridade comercial
 * atual usada em /midia e na prévia da Home.
 */
export type MediaFormatKey =
  "painel" | "wifi" | "tela" | "midia-interna" | "adesivacao-catracas" | "envelopamento";

export type MediaFormatExample = {
  key: MediaFormatKey;
  title: string;
  image: string;
  /** object-position ajustado individualmente ao elemento publicitário de cada imagem. */
  objectPosition: string;
};

export const mediaFormatExamples: MediaFormatExample[] = [
  {
    key: "painel",
    title: "Painel",
    image: "/painel_estatico.png",
    objectPosition: "50% 40%",
  },
  {
    key: "wifi",
    title: "Wi-Fi",
    image: "/wifi_social_fotos.jpeg",
    objectPosition: "50% 50%",
  },
  {
    key: "tela",
    title: "Tela",
    image: "/central_rodoviaria.jpg",
    objectPosition: "50% 46%",
  },
  {
    key: "midia-interna",
    title: "Mídia interna",
    image: "/midia_interna_vagao.png",
    objectPosition: "40% 38%",
  },
  {
    key: "adesivacao-catracas",
    title: "Adesivação de catracas",
    image: "/adesivacao_catracas.png",
    objectPosition: "62% 38%",
  },
  {
    key: "envelopamento",
    title: "Envelopamento do metrô",
    image: "/envelopamento_vagao.png",
    objectPosition: "22% 62%",
  },
];

export function mediaFormatExample(key: MediaFormatKey): MediaFormatExample {
  return mediaFormatExamples.find((m) => m.key === key)!;
}
