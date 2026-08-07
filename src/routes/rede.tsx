import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingCTA } from "@/components/site/FloatingCTA";
import { Network } from "@/components/site/Network";
import { Points } from "@/components/site/Points";
import { ExploreCoverage } from "@/components/site/ExploreCoverage";

export const Route = createFileRoute("/rede")({
  head: () => ({
    meta: [
      { title: "Nossa Rede e Nossos Pontos — MOBTV" },
      {
        name: "description",
        content:
          "A maior rede de WiFi e DOOH do Distrito Federal — conheça onde a MOBTV está presente, com mapa de cobertura em tempo real.",
      },
    ],
  }),
  component: RedePage,
});

function RedePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <Network />
        <Points />
        <ExploreCoverage />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
