import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { auditedImpacts, networkFootprint, approxReach } from "@/data/mobtv-data";
import { totalPointsCount } from "@/data/network-points";

function formatBR(n: number) {
  return n.toLocaleString("pt-BR");
}

function DominantNumber({ visible }: { visible: boolean }) {
  const v = useCountUp(auditedImpacts.value, visible, 1800);
  return (
    <div>
      <div
        className="font-mono font-bold text-gold leading-none"
        style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}
      >
        {formatBR(v)}
      </div>
      <div className="mt-3 font-mono text-sm uppercase tracking-wide text-off-white/60">
        impactos DOOH auditados por mês
      </div>
    </div>
  );
}

export function HomeNumeros() {
  const header = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const grid = useReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="relative overflow-hidden bg-navy text-off-white py-24 md:py-32 px-6">
      {/* Subtle signal arcs — continuity with Hero/Resultados */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ overflow: "visible" }}
      >
        {[180, 280, 400, 540].map((r, i) => {
          const c = 2 * Math.PI * r;
          const arc = c * (160 / 360);
          return (
            <circle
              key={r}
              cx="100%"
              cy="0"
              r={r}
              fill="none"
              stroke={i % 2 === 0 ? "var(--gold)" : "var(--teal)"}
              strokeWidth="1"
              strokeOpacity={0.08 - i * 0.012}
              strokeDasharray={`${arc} ${c}`}
              strokeDashoffset={-c * 0.55}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          );
        })}
      </svg>

      <div className="relative max-w-7xl mx-auto">
        <div ref={header.ref} data-visible={header.visible} className="reveal-root max-w-3xl">
          <div className="reveal reveal-1 font-mono text-sm text-gold tracking-widest">
            / AUDITORIA
          </div>
          <h2 className="reveal reveal-2 mt-3 font-display text-3xl md:text-5xl font-bold text-off-white leading-tight">
            Não é estimativa. É auditado.
          </h2>
        </div>

        <div ref={grid.ref} data-visible={grid.visible} className="reveal-root mt-14 md:mt-16">
          <div className="reveal reveal-1 grid md:grid-cols-[auto_1fr] gap-8 md:gap-16 items-center">
            <DominantNumber visible={grid.visible} />
            <p className="max-w-md text-off-white/70 text-base md:text-lg leading-relaxed md:border-l md:border-white/10 md:pl-10">
              Câmeras nos painéis LED + IA fazem contagem real de impactos, identificando faixa
              etária e sexo. Auditado pela Datavisiooh.
            </p>
          </div>

          <div className="reveal reveal-2 mt-12 md:mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-8 font-mono text-sm text-off-white/60">
            <span>
              <span className="text-gold font-medium">{totalPointsCount}</span> pontos
            </span>
            <span className="hidden sm:block h-3 w-px bg-off-white/25" />
            <span>
              <span className="text-gold font-medium">{networkFootprint.cities}</span> cidades
            </span>
            <span className="hidden sm:block h-3 w-px bg-off-white/25" />
            <span>
              <span className="text-gold font-medium">
                +{formatBR(approxReach.wifiOnlyMillions)} mi
              </span>{" "}
              impactos WiFi
            </span>
          </div>
        </div>

        <div className="mt-12 md:mt-14">
          <Link
            to="/sobre"
            className="font-mono text-sm text-gold hover:text-gold-deep transition-colors"
          >
            Ver todos os resultados e auditoria →
          </Link>
        </div>
      </div>
    </section>
  );
}
