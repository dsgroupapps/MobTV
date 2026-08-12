import { useState, useMemo } from "react";
import { useReveal } from "@/hooks/useReveal";
import transportesImg from "@/assets/network-transportes.jpg";
import saudeImg from "@/assets/network-saude.jpg";
import feirasImg from "@/assets/network-feiras.jpg";
import servicosImg from "@/assets/network-servicos.jpg";
import {
  networkPoints,
  pointMediaTypes,
  type Category,
  type CategoryKey,
  type MediaTypeKey,
  type NetworkPoint,
} from "@/data/network-points";
import { MediaTypeChips, mediaTabs } from "./AssetExplorer";

// Fallback fotográfico por categoria — usado só quando o ponto ainda não tem
// foto própria em network-points.ts (fonte única de local→imagem).
const categoryFallbackImage: Record<CategoryKey, string> = {
  metro: transportesImg,
  terminais: transportesImg,
  upas: saudeImg,
  hospitais: saudeImg,
  feiras: feirasImg,
  restaurantes: servicosImg,
  servicos: servicosImg,
};

const categoryTabs: { key: CategoryKey | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  ...networkPoints.map((c) => ({ key: c.key, label: c.label })),
];

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

export function Gallery() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey | "todos">("todos");
  const [activeMedia, setActiveMedia] = useState<MediaTypeKey | "todos">("todos");
  const header = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const grid = useReveal<HTMLDivElement>({ threshold: 0.1 });

  const filtered = useMemo(() => {
    const cats =
      activeCategory === "todos" ? networkPoints : networkPoints.filter((c) => c.key === activeCategory);
    const out: { point: NetworkPoint; category: Category }[] = [];
    for (const cat of cats) {
      for (const point of cat.points) {
        if (activeMedia !== "todos" && !pointMediaTypes(point).includes(activeMedia)) continue;
        out.push({ point, category: cat });
      }
    }
    return out;
  }, [activeCategory, activeMedia]);

  return (
    <section id="galeria" className="bg-off-white text-ink py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div ref={header.ref} data-visible={header.visible} className="reveal-root max-w-3xl mb-14">
          <div className="reveal reveal-1 font-mono text-xs uppercase tracking-[0.3em] text-gold-deep mb-5">
            / GALERIA
          </div>
          <h2 className="reveal reveal-2 font-display font-bold text-ink text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
            Conheça nossos pontos
          </h2>
          <p className="reveal reveal-3 mt-5 text-ink-soft text-base md:text-lg leading-relaxed">
            Cobertura WiFi ADS e DOOH em 16 cidades do Distrito Federal — a maior rede da região.
          </p>
        </div>

        {/* Tabs — ambiente */}
        <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
          {categoryTabs.map((t) => {
            const isActive = activeCategory === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveCategory(t.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-gold text-navy shadow-[0_6px_20px_-6px_rgba(242,183,5,0.5)]"
                    : "bg-navy/5 text-ink/70 ring-1 ring-ink/10 hover:bg-navy/10 hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tabs — tipo de mídia */}
        <div className="flex flex-wrap items-center gap-2 mb-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40 mr-1">
            Tipo de mídia:
          </span>
          {mediaTabs.map((t) => {
            const isActive = activeMedia === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveMedia(t.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-teal text-navy shadow-[0_6px_20px_-6px_rgba(45,212,191,0.5)]"
                    : "bg-navy/5 text-ink/70 ring-1 ring-ink/10 hover:bg-navy/10 hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div
          key={`${activeCategory}-${activeMedia}`}
          ref={grid.ref}
          data-visible={grid.visible}
          className="reveal-root grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6"
        >
          {filtered.map(({ point, category }, i) => {
            const mediaTypes = pointMediaTypes(point);
            const image = point.images?.[0] ?? categoryFallbackImage[category.key];
            return (
              <article
                key={`${category.key}-${point.nome}`}
                className="gallery-card group relative overflow-hidden rounded-2xl shadow-[0_8px_28px_-12px_rgba(11,18,32,0.25)] h-[280px] sm:h-[300px] lg:h-[320px]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Background image */}
                <img
                  src={image}
                  alt={point.nome}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {/* Gradient overlay */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/20"
                />

                {/* Category tag — canto superior esquerdo, sozinho (sem badge concorrente) */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-block rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-white/90 ring-1 ring-white/20">
                    {category.label}
                  </span>
                </div>

                {/* Bottom content — nome, chips de mídia e impacto num único bloco
                    empilhado, sem sobreposição com nada mais no card */}
                <div className="relative z-10 flex h-full flex-col justify-end gap-2 p-5">
                  <MediaTypeChips types={mediaTypes} />
                  <h3 className="font-display font-semibold text-white text-lg leading-tight">
                    {point.nome}
                  </h3>
                  {point.impactosAuditadosMes != null && (
                    <span className="font-mono text-xs text-white/70">
                      {formatNumber(point.impactosAuditadosMes)} impactos/mês
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
