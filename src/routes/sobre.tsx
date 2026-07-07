import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingCTA } from "@/components/site/FloatingCTA";
import { About } from "@/components/site/About";
import { Results } from "@/components/site/Results";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a MOBTV — Resultados e Auditoria" },
      {
        name: "description",
        content:
          "Conheça a MOBTV e os resultados auditados da nossa rede de mídia DOOH e WiFi Ads no Distrito Federal.",
      },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <About />
        <Results />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
