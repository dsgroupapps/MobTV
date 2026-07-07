import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingCTA } from "@/components/site/FloatingCTA";
import { Gallery } from "@/components/site/Gallery";

export const Route = createFileRoute("/galeria")({
  head: () => ({
    meta: [
      { title: "Galeria — MOBTV" },
      {
        name: "description",
        content: "Conheça nossos pontos de cobertura em fotos — estações de metrô, terminais, UPAs, feiras e mais.",
      },
    ],
  }),
  component: GaleriaPage,
});

function GaleriaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <Gallery />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
