import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";

export function HomeContato() {
  const { ref, visible } = useReveal<HTMLElement>({ threshold: 0.15 });

  return (
    <section ref={ref} data-visible={visible} className="reveal-root bg-navy py-20 md:py-28 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="reveal reveal-1 font-mono text-sm text-gold tracking-widest mb-4">
          / CONTATO
        </p>
        <h2 className="reveal reveal-2 font-display text-3xl md:text-5xl font-bold text-off-white leading-tight mb-4">
          Vamos colocar sua marca no ar
        </h2>
        <p className="reveal reveal-3 text-base md:text-lg text-off-white/70 max-w-2xl mx-auto mb-10">
          Fale com a nossa equipe e descubra o melhor formato para a sua campanha.
        </p>
        <div className="reveal reveal-4 flex flex-col items-center gap-5">
          <a
            href="https://wa.me/5561992590234"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-base md:text-lg px-8 py-4"
          >
            Anuncie Agora
          </a>
          <Link
            to="/contato"
            className="font-mono text-sm text-off-white/70 hover:text-gold transition-colors"
          >
            Fale conosco →
          </Link>
        </div>
      </div>
    </section>
  );
}
