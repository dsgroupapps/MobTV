import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingCTA } from "@/components/site/FloatingCTA";
import { Contact } from "@/components/site/Contact";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — MOBTV" },
      {
        name: "description",
        content: "Fale com a equipe MOBTV e descubra o melhor formato de mídia para a sua campanha.",
      },
    ],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <Contact />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
