import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { approxReach, networkFootprint } from "@/data/mobtv-data";
import { totalPointsCount } from "@/data/network-points";
import heroEstacaoCentral from "@/assets/hero-estacao-central.jpg";

/**
 * Carrossel de 5 fotografias reais da operação MOBTV — todas já existentes
 * no projeto (nenhuma imagem nova/estoque). Cada estado tem seu próprio
 * enquadramento (objectPosition) e ponto de origem do zoom (transformOrigin)
 * ajustado individualmente ao elemento principal da foto.
 */
const slides = [
  {
    id: "escala",
    image: heroEstacaoCentral,
    objectPosition: "70% 45%",
    transformOrigin: "70% 45%",
    kicker: "/ ESCALA REAL",
    caption: "Estação Central · Metrô-DF",
  },
  {
    id: "dooh",
    image: "/estacao_praca.jpg",
    objectPosition: "64% 40%",
    transformOrigin: "64% 40%",
    kicker: "/ DOOH — nos principais fluxos do DF",
    caption: "Estação Praça do Relógio · Metrô-DF",
  },
  {
    id: "marca",
    image: "/foto_hero_mobtv.jpg",
    objectPosition: "50% 50%",
    transformOrigin: "50% 50%",
    kicker: "/ MOBTV — mídia DOOH com presença real",
    caption: "MOBTV · Mídia DOOH",
  },
  {
    id: "wifi",
    image: "/wifi_social_fotos.jpeg",
    objectPosition: "40% 35%",
    transformOrigin: "40% 35%",
    kicker: "/ WIFI ADS — conexão direta com a audiência",
    caption: "WiFi Social DF · Rede MOBTV",
  },
  {
    id: "rede",
    image: "/imagem_para_hero.jpg",
    objectPosition: "58% 45%",
    transformOrigin: "58% 45%",
    kicker: "/ REDE — nos ambientes de maior fluxo do DF",
    caption: "Terminal BRT Gama",
  },
] as const;

const AUTOPLAY_MS = 6500;

export function Hero() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const tick = () => {
      if (!pausedRef.current) setActive((i) => (i + 1) % slides.length);
    };
    timerRef.current = setInterval(tick, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };
  const goTo = (i: number) => {
    setActive(i);
  };

  const current = slides[active];

  // raios crescentes, opacidade decrescente, cores alternando
  const arcs = [
    { r: 150, color: "#F2B705", opacity: 0.4, delay: 0 },
    { r: 280, color: "#2DD4BF", opacity: 0.3, delay: 1 },
    { r: 420, color: "#F2B705", opacity: 0.22, delay: 2 },
    { r: 580, color: "#2DD4BF", opacity: 0.14, delay: 3 },
    { r: 740, color: "#F2B705", opacity: 0.1, delay: 4 },
  ];

  // arco de ~140° (mostra apenas uma fração do círculo)
  const arcFraction = 140 / 360;

  return (
    <section
      id="inicio"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className="relative overflow-hidden bg-navy text-off-white min-h-[92vh] flex items-center px-6 py-24"
    >
      {/* Fotografias reais da operação MOBTV, empilhadas com crossfade — só a
          ativa tem opacity 1. Zoom cinematográfico lento e contínuo (ambient,
          independente do crossfade) em todas as camadas. */}
      <div className="absolute inset-0" aria-hidden>
        {slides.map((s, i) => (
          <img
            key={s.id}
            src={s.image}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "low"}
            className="hero-slide-zoom absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition: s.objectPosition,
              transformOrigin: s.transformOrigin,
              opacity: i === active ? 1 : 0,
              transition: "opacity 1.4s ease-in-out",
            }}
          />
        ))}
      </div>

      {/* Overlay localizado: navy sólido atrás do texto (esquerda), quase
          transparente sobre a fotografia (direita) — split composition em vez
          de um véu escuro uniforme sobre a imagem inteira. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, var(--navy) 0%, var(--navy) 28%, color-mix(in oklab, var(--navy) 68%, transparent) 46%, color-mix(in oklab, var(--navy) 22%, transparent) 66%, transparent 85%)",
        }}
      />
      {/* Fade inferior — legibilidade da barra de stats e transição suave
          para a próxima seção, qualquer que seja a foto ativa. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(0deg, color-mix(in oklab, var(--navy) 85%, transparent) 0%, transparent 20%, transparent 80%, color-mix(in oklab, var(--navy) 35%, transparent) 100%)",
        }}
      />

      {/* Ondas de sinal — motivo de marca, discreto, deslocado para a direita
          para não competir com a fotografia agora mais visível. */}
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
          const dashOffset = -circ * 0.25;
          return (
            <circle
              key={i}
              cx="95%"
              cy="-5%"
              r={a.r}
              fill="none"
              stroke={a.color}
              strokeWidth={1.5}
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

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl">
          <div
            key={`${current.id}-kicker`}
            className="hero-caption-enter font-mono text-xs uppercase tracking-[0.25em] text-gold min-h-[1.25rem]"
          >
            {current.kicker}
          </div>

          <h1 className="hero-stagger hero-stagger-1 mt-4 font-display font-bold text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
            <span className="text-gold">+{approxReach.combinedMillions} milhões</span> de impactos
            por mês em <span className="text-gold">WiFi</span>,{" "}
            <span className="text-gold">DOOH</span> e <span className="text-gold">Painéis LED</span>{" "}
            no DF
          </h1>

          <p className="hero-stagger hero-stagger-2 mt-6 text-lg sm:text-xl text-off-white/70 max-w-2xl leading-relaxed">
            A maior cobertura indoor do Distrito Federal — auditada e em tempo real.
          </p>

          <div className="hero-stagger hero-stagger-3 mt-10 flex flex-wrap items-center gap-4">
            <Link to="/rede" className="btn-primary">
              Ver Mapa de Cobertura
            </Link>
            <Link
              to="/planejador"
              className="inline-flex items-center justify-center bg-transparent text-gold border border-gold rounded-lg px-6 py-3 font-semibold transition-colors hover:bg-gold hover:text-navy"
            >
              Monte sua Campanha
            </Link>
          </div>

          <div className="hero-stagger hero-stagger-4 mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-sm text-off-white/60">
            <span>{totalPointsCount} pontos</span>
            <span className="h-3 w-px bg-off-white/25" />
            <span>{networkFootprint.cities} cidades do DF</span>
            <span className="h-3 w-px bg-off-white/25" />
            <span>+{approxReach.combinedMillions} milhões de impactos/mês</span>
          </div>
        </div>
      </div>

      {/* Indicadores — sempre visíveis (mobile: centralizados embaixo;
          desktop: canto inferior direito, junto da legenda do local). */}
      <div className="absolute bottom-6 inset-x-0 flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end z-10 items-center gap-4">
        <span
          key={`${current.id}-caption`}
          className="hero-caption-enter hidden sm:block font-mono text-[11px] uppercase tracking-[0.2em] text-off-white/45"
        >
          {current.caption}
        </span>
        <div className="flex items-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ver ${s.caption}`}
              aria-current={i === active}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                i === active ? "w-6 bg-gold" : "w-1.5 bg-off-white/35 hover:bg-off-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
