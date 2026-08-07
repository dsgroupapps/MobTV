import { useReveal } from "@/hooks/useReveal";
import { Monitor, Wifi, ExternalLink } from "lucide-react";

// Google My Maps oficial da MOBTV — mesmo "mid" do embed, usado tanto no
// iframe quanto no link "Abrir mapa completo" (visualizador My Maps).
const MAP_ID = "1a48OtuggfB11inQkrpa7dbm-HmrS8CE";
const EMBED_SRC = `https://www.google.com/maps/d/embed?mid=${MAP_ID}&ehbc=2E312F`;
const FULL_MAP_URL = `https://www.google.com/maps/d/viewer?mid=${MAP_ID}`;

const legend = [
  { icon: Monitor, label: "LED e Monitores Indoor", dot: "bg-gold" },
  { icon: Wifi, label: "Redes WiFi Personalizáveis", dot: "bg-teal" },
] as const;

export function ExploreCoverage() {
  const { ref, visible } = useReveal<HTMLDivElement>({ threshold: 0.12 });

  return (
    <section className="bg-off-white text-ink py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div ref={ref} data-visible={visible} className="reveal-root">
          {/* Header */}
          <div className="max-w-3xl">
            <div className="reveal reveal-1 font-mono text-xs uppercase tracking-[0.3em] text-gold-deep mb-5">
              / COBERTURA REAL
            </div>
            <h2 className="reveal reveal-2 font-display font-bold text-ink text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
              Explore nossa cobertura
            </h2>
            <p className="reveal reveal-3 mt-5 text-ink-soft text-base md:text-lg leading-relaxed">
              Veja onde a MOBTV está presente no Distrito Federal e explore os pontos reais de LED,
              monitores indoor e redes WiFi.
            </p>
          </div>

          {/* Legend / badges */}
          <div className="reveal reveal-3 mt-8 flex flex-wrap items-center gap-3">
            {legend.map(({ icon: Icon, label, dot }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2.5 rounded-full bg-white ring-1 ring-black/10 shadow-sm pl-2 pr-4 py-2"
              >
                <span
                  className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${dot} text-navy`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <span className="text-sm font-medium text-ink">{label}</span>
              </span>
            ))}
          </div>

          {/* Map — moldura premium, sem cara de embed solto */}
          <div className="reveal reveal-4 mt-10 md:mt-12 rounded-[28px] border border-black/10 bg-white p-2 sm:p-3 shadow-[0_20px_60px_-25px_rgba(11,18,32,0.25)]">
            <div className="relative w-full overflow-hidden rounded-[20px] h-[380px] sm:h-[520px] lg:h-[680px]">
              <iframe
                src={EMBED_SRC}
                title="Mapa interativo da cobertura MOBTV no Distrito Federal"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>

          {/* CTA — alinhado à esquerda mesmo no mobile: o FloatingCTA fica
              fixo no canto inferior direito, e um botão centralizado ou
              largo demais acaba embaixo dele nesta faixa da página. */}
          <div className="reveal reveal-5 mt-8 flex justify-start">
            <a
              href={FULL_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3.5"
            >
              Abrir mapa completo
              <ExternalLink className="h-4 w-4" strokeWidth={2} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
