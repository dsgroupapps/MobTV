export function Hero() {
  // raios crescentes, opacidade decrescente, cores alternando
  const arcs = [
    { r: 150, color: "#F2B705", opacity: 0.35, delay: 0 },
    { r: 280, color: "#2DD4BF", opacity: 0.26, delay: 1 },
    { r: 420, color: "#F2B705", opacity: 0.18, delay: 2 },
    { r: 580, color: "#2DD4BF", opacity: 0.12, delay: 3 },
    { r: 740, color: "#F2B705", opacity: 0.08, delay: 4 },
  ];

  // arco de ~140° (mostra apenas uma fração do círculo)
  const arcFraction = 140 / 360;

  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-navy text-off-white min-h-[92vh] flex items-center px-6 py-24"
    >
      {/* Ondas de sinal — SVG cobrindo a seção inteira */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 w-full h-full z-[1]"
        style={{ overflow: "visible" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {arcs.map((a, i) => {
          const circ = 2 * Math.PI * a.r;
          const arcLen = circ * arcFraction;
          const gapLen = circ - arcLen;
          // posiciona o segmento visível no quadrante sul/sudoeste (dentro da seção)
          const dashOffset = -circ * 0.25;
          return (
            <circle
              key={i}
              cx="95%"
              cy="-5%"
              r={a.r}
              fill="none"
              stroke={a.color}
              strokeWidth={1.25}
              strokeLinecap="round"
              strokeDasharray={`${arcLen} ${gapLen}`}
              strokeDashoffset={dashOffset}
              strokeOpacity={a.opacity}
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                animation: `signal-pulse 7s ease-in-out ${a.delay}s infinite`,
              }}
            />
          );
        })}
      </svg>

      {/* Subtle radial glow behind text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 20% 30%, color-mix(in oklab, var(--gold) 18%, transparent), transparent 55%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl">
          <div className="hero-stagger hero-stagger-1 font-mono text-xs uppercase tracking-[0.3em] text-gold mb-6">
            / INÍCIO
          </div>

          <h1 className="hero-stagger hero-stagger-2 font-display font-bold text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
            <span className="text-gold">+10 milhões</span> de impactos por mês em{" "}
            <span className="text-gold">WiFi</span>,{" "}
            <span className="text-gold">DOOH</span> e{" "}
            <span className="text-gold">Painéis LED</span> no DF
          </h1>

          <p className="hero-stagger hero-stagger-3 mt-6 text-lg sm:text-xl text-off-white/70 max-w-2xl leading-relaxed">
            A maior cobertura indoor do Distrito Federal — auditada e em tempo real.
          </p>

          <div className="hero-stagger hero-stagger-4 mt-10 flex flex-wrap items-center gap-4">
            <a href="#rede" className="btn-primary">
              Mapa de Cobertura
            </a>
            <a
              href="#contato"
              className="inline-flex items-center justify-center bg-transparent text-gold border border-gold rounded-lg px-6 py-3 font-semibold transition-colors hover:bg-gold hover:text-navy"
            >
              Anuncie Agora
            </a>
          </div>

          <div className="hero-stagger hero-stagger-5 mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-sm text-off-white/60">
            <span>53 pontos</span>
            <span className="h-3 w-px bg-off-white/25" />
            <span>16 cidades do DF</span>
            <span className="h-3 w-px bg-off-white/25" />
            <span>39 telas / 27 locais</span>
          </div>
        </div>
      </div>
    </section>
  );
}
