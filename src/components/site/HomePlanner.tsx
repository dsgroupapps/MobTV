import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";

// Ponto de entrada principal do Planejador de Campanha. Deliberadamente o
// único CTA de destaque para /planejador na Home — os outros pontos de
// entrada (/midia, AssetExplorer) são secundários e contextuais.
export function HomePlanner() {
  const { ref, visible } = useReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="bg-navy text-off-white py-20 md:py-28 px-6">
      <div
        ref={ref}
        data-visible={visible}
        className="reveal-root max-w-7xl mx-auto rounded-3xl border border-gold/25 bg-gradient-to-br from-[color-mix(in_oklab,var(--navy-soft)_75%,transparent)] to-transparent p-8 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
      >
        <div className="reveal reveal-1 max-w-xl">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold mb-4">
            / PLANEJADOR DE CAMPANHA
          </div>
          <h2 className="font-display font-bold text-white text-2xl sm:text-3xl lg:text-4xl leading-tight tracking-tight">
            Monte sua campanha
          </h2>
          <p className="mt-4 text-white/70 text-base md:text-lg leading-relaxed">
            Escolha objetivo, região, ambiente e mídia — veja os pontos reais disponíveis e simule o
            investimento com base na tabela comercial vigente.
          </p>
        </div>
        <div className="reveal reveal-2 shrink-0">
          <Link to="/planejador" className="btn-primary px-8 py-4 text-base">
            Monte sua campanha →
          </Link>
        </div>
      </div>
    </section>
  );
}
