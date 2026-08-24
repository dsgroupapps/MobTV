import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CampaignPlanner } from "@/components/site/CampaignPlanner";
import type { CategoryKey } from "@/data/network-points";

const VALID_CATEGORIES: CategoryKey[] = [
  "metro",
  "terminais",
  "upas",
  "hospitais",
  "feiras",
  "servicos",
];

type PlanejadorSearch = {
  ponto?: string;
  categoria?: CategoryKey;
};

export const Route = createFileRoute("/planejador")({
  validateSearch: (search: Record<string, unknown>): PlanejadorSearch => ({
    ponto: typeof search.ponto === "string" ? search.ponto : undefined,
    categoria:
      typeof search.categoria === "string" &&
      VALID_CATEGORIES.includes(search.categoria as CategoryKey)
        ? (search.categoria as CategoryKey)
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Monte sua Campanha — MOBTV" },
      {
        name: "description",
        content:
          "Planeje sua campanha na rede MOBTV: escolha mídia, filtre o catálogo de pontos e solicite uma proposta comercial.",
      },
    ],
  }),
  component: PlanejadorPage,
});

function PlanejadorPage() {
  const { ponto, categoria } = Route.useSearch();
  const initialPoint = ponto && categoria ? { nome: ponto, categoria } : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <CampaignPlanner initialPoint={initialPoint} />
      </main>
      <Footer />
    </div>
  );
}
