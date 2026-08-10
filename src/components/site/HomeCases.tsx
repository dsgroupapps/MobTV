import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";
import caseEvolve from "@/assets/case-evolve.jpg";
import caseBluefit from "@/assets/case-bluefit.jpg";
import caseVivo from "@/assets/case-vivo.jpg";

// Teaser da seção completa de Cases, que vive em /sobre. Mesmas 3 execuções
// reais (Media Kit p.55-59) — aqui só como prova rápida de escala na Home.
const logos = [
  { cliente: "Evolve", imagem: caseEvolve },
  { cliente: "Bluefit", imagem: caseBluefit },
  { cliente: "Vivo Total", imagem: caseVivo },
];

export function HomeCases() {
  const reveal = useReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="bg-off-white text-ink py-16 md:py-20 px-6 border-t border-ink/5">
      <div ref={reveal.ref} data-visible={reveal.visible} className="reveal-root max-w-7xl mx-auto">
        <div className="reveal reveal-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold-deep mb-3">
              / CASES
            </div>
            <h2 className="font-display font-bold text-ink text-2xl sm:text-3xl">
              Marcas que já ocuparam a rede
            </h2>
          </div>
          <Link
            to="/sobre"
            hash="cases"
            className="font-mono text-sm text-gold-deep hover:text-gold transition-colors shrink-0"
          >
            Ver todos os cases →
          </Link>
        </div>

        <div className="reveal reveal-2 mt-8 grid grid-cols-3 gap-3 md:gap-5">
          {logos.map((item) => (
            <div
              key={item.cliente}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl"
            >
              <img
                src={item.imagem}
                alt={item.cliente}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/10 to-transparent"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <span className="font-mono text-[11px] md:text-xs uppercase tracking-wider text-off-white">
                  {item.cliente}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
