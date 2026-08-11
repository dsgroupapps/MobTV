import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingCTA } from "@/components/site/FloatingCTA";
import { Hero } from "@/components/site/Hero";
import { HomeNumeros } from "@/components/site/HomeNumeros";
import { HomeCases } from "@/components/site/HomeCases";
import { HomeDiferenciais } from "@/components/site/HomeDiferenciais";
import { OndeEstamos } from "@/components/site/OndeEstamos";
import { HomeSobre } from "@/components/site/HomeSobre";
import { HomeRede } from "@/components/site/HomeRede";
import { HomePlanner } from "@/components/site/HomePlanner";
import { HomeContato } from "@/components/site/HomeContato";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MOBTV — Mídia DOOH + WiFi Ads no Distrito Federal" },
      { name: "description", content: "Rede de mídia DOOH e WiFi Ads no Distrito Federal." },
    ],
  }),
  component: Index,
});

// Home é uma vitrine de alto impacto, não um resumo apertado. As seções
// completas (Sobre, Resultados, Nossa Rede, Benefícios, Mídia, Nossos
// Pontos, Galeria, Contato) vivem em suas próprias rotas dedicadas:
// /sobre, /rede, /midia, /galeria, /contato.
function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <Hero />
        <HomeNumeros />
        <HomeCases />
        <HomeDiferenciais />
        <OndeEstamos />
        <HomeSobre />
        <HomeRede />
        <HomePlanner />
        <HomeContato />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
