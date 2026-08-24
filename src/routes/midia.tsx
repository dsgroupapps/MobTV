import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingCTA } from "@/components/site/FloatingCTA";
import { Benefits } from "@/components/site/Benefits";
import { Media } from "@/components/site/Media";

export const Route = createFileRoute("/midia")({
  head: () => ({
    meta: [
      { title: "Benefícios e Mídia — MOBTV" },
      {
        name: "description",
        content: "Conheça os benefícios do WiFi Ads e os formatos de mídia DOOH da MOBTV.",
      },
    ],
  }),
  component: MidiaPage,
});

function MidiaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <Benefits />
        <Media />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
