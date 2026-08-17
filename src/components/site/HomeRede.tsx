import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";
import { CoverageMap } from "./CoverageMap";
import { totalPointsCount } from "@/data/network-points";

export function HomeRede() {
  const header = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const mapReveal = useReveal<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="relative bg-navy text-off-white py-24 md:py-32 px-6 overflow-hidden">
      {/* subtle signal arcs backdrop — same motif as Nossos Pontos */}
      <svg aria-hidden className="absolute inset-0 h-full w-full opacity-40 pointer-events-none">
        <g fill="none" strokeWidth="1">
          <circle cx="95%" cy="-5%" r="220" stroke="#F2B705" strokeOpacity="0.18" strokeDasharray="380 900" />
          <circle cx="95%" cy="-5%" r="380" stroke="#2DD4BF" strokeOpacity="0.12" strokeDasharray="600 1400" />
          <circle cx="95%" cy="-5%" r="560" stroke="#F2B705" strokeOpacity="0.08" strokeDasharray="900 2000" />
        </g>
      </svg>

      <div className="relative max-w-7xl mx-auto">
        <div ref={header.ref} data-visible={header.visible} className="reveal-root max-w-3xl">
          <div className="reveal reveal-1 font-mono text-xs uppercase tracking-[0.3em] text-gold mb-5">
            / COBERTURA
          </div>
          <h2 className="reveal reveal-2 font-display font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
            {totalPointsCount} pontos. 16 cidades. Um só mapa.
          </h2>
          <p className="reveal reveal-3 mt-5 text-white/70 text-base md:text-lg leading-relaxed">
            A MOBTV possui a maior cobertura WiFi e o maior impacto em DOOH do Distrito Federal —
            presente em estações de metrô, terminais de BRT, hospitais, feiras e pontos de
            serviço.
          </p>
        </div>

        <div ref={mapReveal.ref} data-visible={mapReveal.visible} className="reveal-root mt-14 md:mt-16">
          <div className="reveal reveal-1 relative rounded-2xl border border-white/10 bg-[color-mix(in_oklab,var(--navy-soft)_60%,transparent)] p-6 md:p-10 backdrop-blur-sm">
            <CoverageMap />
          </div>
        </div>

        <div className="mt-12 md:mt-14">
          <Link to="/rede" className="font-mono text-sm text-gold hover:text-gold-deep transition-colors">
            Veja onde estamos →
          </Link>
        </div>
      </div>
    </section>
  );
}
