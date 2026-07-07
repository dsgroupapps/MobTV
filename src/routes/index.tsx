import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingCTA } from "@/components/site/FloatingCTA";
import { SectionPlaceholder } from "@/components/site/SectionPlaceholder";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { Results } from "@/components/site/Results";
import { Network } from "@/components/site/Network";
import { Benefits } from "@/components/site/Benefits";
import { Media } from "@/components/site/Media";
import { Points } from "@/components/site/Points";
import { Gallery } from "@/components/site/Gallery";
import { Contact } from "@/components/site/Contact";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MOBTV — Mídia DOOH + WiFi Ads no Distrito Federal" },
      { name: "description", content: "Rede de mídia DOOH e WiFi Ads no Distrito Federal." },
    ],
  }),
  component: Index,
});

// Fixed background rhythm — do not alternate mechanically.
const sections: { id: string; title: string; variant: "light" | "dark" }[] = [
  { id: "inicio", title: "Início", variant: "dark" },
  { id: "sobre", title: "Sobre Nós", variant: "light" },
  { id: "resultados", title: "Resultados", variant: "dark" },
  { id: "rede", title: "Nossa Rede", variant: "light" },
  { id: "beneficios", title: "Benefícios", variant: "light" },
  { id: "midia", title: "Mídia", variant: "light" },
  { id: "pontos", title: "Nossos Pontos", variant: "dark" },
  { id: "galeria", title: "Galeria", variant: "light" },
  { id: "contato", title: "Contato", variant: "dark" },
];

function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        {sections.map((s) =>
          s.id === "inicio" ? (
            <Hero key={s.id} />
          ) : s.id === "sobre" ? (
            <About key={s.id} />
          ) : s.id === "resultados" ? (
            <Results key={s.id} />
          ) : s.id === "rede" ? (
            <Network key={s.id} />
          ) : s.id === "beneficios" ? (
            <Benefits key={s.id} />
          ) : s.id === "midia" ? (
            <Media key={s.id} />
          ) : s.id === "pontos" ? (
            <Points key={s.id} />
          ) : s.id === "galeria" ? (
            <Gallery key={s.id} />
          ) : s.id === "contato" ? (
            <Contact key={s.id} />
          ) : (
            <SectionPlaceholder key={s.id} id={s.id} title={s.title} variant={s.variant} />
          ),
        )}
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
