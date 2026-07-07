import { useReveal } from "@/hooks/useReveal";
import phoneWifi from "@/assets/about-phone-wifi.jpg";

const stats = [
  { value: "R$ 328,8 bi", label: "PIB do Distrito Federal" },
  { value: "Maior", label: "renda per capita do país" },
  { value: "~3 milhões", label: "de habitantes" },
  { value: "Serviços", label: "setor econômico predominante" },
];

export function About() {
  const { ref, visible } = useReveal<HTMLDivElement>({ threshold: 0.18 });

  return (
    <section
      id="sobre"
      ref={ref}
      data-visible={visible}
      className="bg-off-white text-ink py-24 px-6 reveal-root"
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[55%_45%] gap-12 lg:gap-16 items-start">
        {/* LEFT COLUMN */}
        <div>
          <div className="reveal reveal-1 font-mono text-xs uppercase tracking-[0.3em] text-gold-deep mb-5">
            / SOBRE NÓS
          </div>

          <h2 className="reveal reveal-2 font-display font-bold text-ink text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
            Sobre a MOBTV
          </h2>

          <p className="reveal reveal-3 mt-6 text-ink-soft text-base sm:text-lg leading-relaxed max-w-2xl">
            A MOBTV atua em Brasília no mercado de comunicação digital e
            opera a maior rede de WiFi e DOOH do Distrito Federal,
            por intermédio do programa WiFi Social do GDF. Com anos de
            experiência em mídia digital embarcada em ônibus — monitores e
            redes WiFi — desenvolvemos sistemas e tecnologias próprias que
            impulsionam a inovação no setor. Tecnologia de ponta e
            qualidade são a nossa marca.
          </p>

          <div className="reveal reveal-4 mt-8">
            <a href="#midia" className="btn-primary">
              Download do Mídia Kit
            </a>
          </div>

          <p className="reveal reveal-4-5 mt-8 font-sans font-semibold text-ink text-base sm:text-lg italic">
            E o público que a sua marca quer alcançar já está aqui:
          </p>

          {/* Por que Brasília — navy card */}
          <div className="reveal reveal-5 mt-10 rounded-2xl bg-navy text-off-white p-8 sm:p-10 shadow-[0_20px_50px_-20px_rgba(11,18,32,0.35)]">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold mb-6">
              Por que anunciar em Brasília
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-7">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-mono text-2xl sm:text-3xl text-gold leading-none">
                    {s.value}
                  </div>
                  <div className="mt-2 text-sm text-off-white/70 leading-snug">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — image with subtle signal arcs behind */}
        <div className="reveal-right relative">
          {/* Arcs behind image — discrete echo of hero motif */}
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
