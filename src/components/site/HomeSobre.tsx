import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";
import phoneWifi from "@/assets/about-phone-wifi.jpg";

export function HomeSobre() {
  const { ref, visible } = useReveal<HTMLDivElement>({ threshold: 0.18 });

  return (
    <section
      ref={ref}
      data-visible={visible}
      className="reveal-root bg-off-white text-ink py-24 md:py-32 px-6 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[55%_45%] gap-12 lg:gap-16 items-center">
        {/* LEFT COLUMN */}
        <div>
          <div className="reveal reveal-1 font-mono text-xs uppercase tracking-[0.3em] text-gold-deep mb-5">
            / QUEM SOMOS
          </div>

          <h2 className="reveal reveal-2 font-display font-bold text-ink text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
            Sobre a MOBTV
          </h2>

          <p className="reveal reveal-3 mt-6 text-ink-soft text-base sm:text-lg leading-relaxed max-w-2xl">
            A MOBTV atua em Brasília no mercado de comunicação digital e opera a maior rede de WiFi
            e DOOH do Distrito Federal, por intermédio do programa WiFi Social do GDF. Com anos de
            experiência em mídia digital embarcada em ônibus — monitores e redes WiFi —
            desenvolvemos sistemas e tecnologias próprias que impulsionam a inovação no setor.
            Tecnologia de ponta e qualidade são a nossa marca.
          </p>

          <div className="reveal reveal-4 mt-8">
            <Link
              to="/sobre"
              className="font-mono text-sm text-gold-deep hover:text-ink transition-colors"
            >
              Conheça a MOBTV →
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN — image with subtle signal arcs behind */}
        <div className="reveal-right relative">
          <svg
            aria-hidden
            className="pointer-events-none absolute -top-6 -right-6 w-[110%] h-[110%] z-0"
            style={{ overflow: "visible" }}
          >
            {[
              { r: 120, color: "#F2B705", op: 0.28 },
              { r: 200, color: "#2DD4BF", op: 0.18 },
              { r: 290, color: "#F2B705", op: 0.1 },
            ].map((a, i) => {
              const circ = 2 * Math.PI * a.r;
              const arcLen = circ * (140 / 360);
              return (
                <circle
                  key={i}
                  cx="92%"
                  cy="-2%"
                  r={a.r}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={1.25}
                  strokeLinecap="round"
                  strokeDasharray={`${arcLen} ${circ - arcLen}`}
                  strokeDashoffset={-circ * 0.25}
                  strokeOpacity={a.op}
                />
              );
            })}
          </svg>

          <div className="relative z-10 overflow-hidden rounded-2xl shadow-[0_30px_60px_-25px_rgba(11,18,32,0.35)] bg-navy/5">
            <img
              src={phoneWifi}
              alt="Mão segurando smartphone com sinal WiFi — MOBTV"
              loading="lazy"
              width={1024}
              height={1280}
              className="block w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
