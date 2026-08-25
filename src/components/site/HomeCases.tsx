import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";
import { mediaFormatExamples } from "@/data/media-format-examples";

const exemplos = mediaFormatExamples.slice(0, 3);

export function HomeCases() {
  const reveal = useReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="bg-off-white text-ink py-16 md:py-20 px-6 border-t border-ink/5">
      <div ref={reveal.ref} data-visible={reveal.visible} className="reveal-root max-w-7xl mx-auto">
        <div className="reveal reveal-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold-deep mb-3">
              / POSSIBILIDADES DE MÍDIA
            </div>
            <h2 className="font-display font-bold text-ink text-2xl sm:text-3xl">
              Imagine sua marca ocupando a rede
            </h2>
          </div>
          <Link
            to="/midia"
            className="font-mono text-sm text-gold-deep hover:text-gold transition-colors shrink-0"
          >
            Conheça os formatos →
          </Link>
        </div>

        <div className="reveal reveal-2 mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-5">
          {exemplos.map((item) => (
            <div
              key={item.key}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl md:rounded-2xl"
            >
              <img
                src={item.image}
                alt={`Exemplo ilustrativo — ${item.title}`}
                loading="lazy"
                style={{ objectPosition: item.objectPosition }}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/10 to-transparent"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <span className="font-mono text-[11px] md:text-xs uppercase tracking-wider text-off-white">
                  {item.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
