import * as React from "react";
import { useReveal } from "@/hooks/useReveal";
import { useCountUp } from "@/hooks/useCountUp";
import {
  ArrowLeft,
  ArrowRight,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  ShoppingCart,
  Smartphone,
  Store,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  auditedImpacts,
  networkFootprint,
  approxReach,
  ledNetwork,
  audienceProfile,
  consumerResearch,
} from "@/data/mobtv-data";
import { totalPointsCount } from "@/data/network-points";

const AUTOPLAY_INTERVAL_MS = 5000;
const consumerResearchIcons = [
  ShoppingCart,
  Store,
  Smartphone,
  GraduationCap,
  HeartPulse,
  Clapperboard,
] as const;

function formatBR(n: number) {
  return n.toLocaleString("pt-BR");
}

function HeadlineNumber() {
  const { ref, visible } = useReveal<HTMLDivElement>({ threshold: 0.3 });
  const value = useCountUp(auditedImpacts.value, visible, 1800);
  return (
    <div ref={ref} className="text-center">
      <div
        className="font-display font-bold text-gold leading-none tracking-tight"
        style={{ fontSize: "clamp(3.5rem, 10vw, 7.5rem)" }}
      >
        {formatBR(value)}
      </div>
      <div className="mt-4 font-mono text-sm md:text-base text-off-white/60">
        impactos auditados por mês · Fonte: Datavisiooh, 2024
      </div>
    </div>
  );
}

function StatCard({
  value,
  prefix = "",
  suffix = "",
  label,
  delay,
  visible,
  formatted,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: React.ReactNode;
  delay: number;
  visible: boolean;
  formatted?: (n: number) => string;
}) {
  const v = useCountUp(value, visible, 1600);
  const text = formatted ? formatted(v) : formatBR(v);
  return (
    <div
      className="rounded-xl border border-gold/25 bg-[color:var(--navy-soft)]/60 backdrop-blur-sm p-6 transition-all"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="font-mono font-medium text-gold text-3xl md:text-4xl">
        {prefix}
        {text}
        {suffix}
      </div>
      <div className="mt-3 text-sm text-off-white/70 leading-snug">{label}</div>
    </div>
  );
}

function StatsGrid() {
  const { ref, visible } = useReveal<HTMLDivElement>({ threshold: 0.2 });
  return (
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      <StatCard value={totalPointsCount} label="pontos de cobertura" delay={0} visible={visible} />
      <StatCard
        value={networkFootprint.cities}
        label="cidades do Distrito Federal"
        delay={120}
        visible={visible}
      />
      <StatCard
        value={ledNetwork.screens}
        label={
          <>
            telas · <span className="font-mono text-gold">{ledNetwork.locations}</span> locais com
            monitores e painéis LED
          </>
        }
        delay={240}
        visible={visible}
      />
      <StatCard
        value={approxReach.wifiOnlyMillions}
        prefix="+"
        suffix=" mi"
        label="impactos mensais só na rede WiFi Ads"
        delay={360}
        visible={visible}
        formatted={(n) => n.toFixed(1).replace(".", ",")}
      />
    </div>
  );
}

function GenderBar({ female, male }: { female: number; male: number }) {
  return (
    <div className="mt-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div className="bg-gold" style={{ width: `${female}%` }} />
        <div className="bg-teal" style={{ width: `${male}%` }} />
      </div>
      <div className="mt-2 flex justify-between font-mono text-xs text-off-white/65">
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-gold align-middle mr-1.5" />
          {female.toString().replace(".", ",")}% mulheres
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-teal align-middle mr-1.5" />
          {male.toString().replace(".", ",")}% homens
        </span>
      </div>
    </div>
  );
}

function AudienceCol({
  title,
  age,
  female,
  male,
  time,
  cats,
}: {
  title: string;
  age: string;
  female: number;
  male: number;
  time: string;
  cats: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[color:var(--navy-soft)]/50 p-6 md:p-7">
      <h3 className="font-display text-xl md:text-2xl text-off-white">{title}</h3>
      <dl className="mt-5 space-y-5 text-sm">
        <div>
          <dt className="font-mono text-xs uppercase tracking-wider text-gold/80">
            Faixa etária predominante
          </dt>
          <dd className="mt-1 text-off-white/85">{age}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase tracking-wider text-gold/80">Distribuição</dt>
          <dd>
            <GenderBar female={female} male={male} />
          </dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase tracking-wider text-gold/80">
            Tempo médio de permanência
          </dt>
          <dd className="mt-1 text-off-white/85">{time}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase tracking-wider text-gold/80">
            Categorias de consumo
          </dt>
          <dd className="mt-1 text-off-white/85">{cats}</dd>
        </div>
      </dl>
    </div>
  );
}

function Pill({
  icon: Icon,
  value,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-full border border-gold/25 bg-[color:var(--navy-soft)]/50 px-5 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="font-mono font-medium text-gold text-lg">{value}</span>
        <span className="text-sm text-off-white/80 leading-snug">{text}</span>
      </div>
    </div>
  );
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

function ConsumerResearchCarousel() {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [api, setApi] = React.useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [autoplayCycle, setAutoplayCycle] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [hasFocus, setHasFocus] = React.useState(false);
  const [isPointerDown, setIsPointerDown] = React.useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const autoplayPaused = prefersReducedMotion || isHovered || hasFocus || isPointerDown;

  React.useEffect(() => {
    if (!api) return;

    const updateSelection = () => {
      setSelectedIndex(api.selectedScrollSnap());
    };

    updateSelection();
    api.on("select", updateSelection);
    api.on("reInit", updateSelection);

    return () => {
      api.off("select", updateSelection);
      api.off("reInit", updateSelection);
    };
  }, [api]);

  React.useEffect(() => {
    if (!api || autoplayPaused) return;

    const timeoutId = window.setTimeout(() => {
      const carousel = carouselRef.current;
      const hasActiveFocus = carousel?.contains(document.activeElement) ?? false;
      const hasActiveHover = carousel?.matches(":hover") ?? false;

      if (hasActiveFocus || hasActiveHover) {
        setAutoplayCycle((cycle) => cycle + 1);
        return;
      }

      api.scrollNext();
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearTimeout(timeoutId);
  }, [api, autoplayCycle, autoplayPaused, selectedIndex]);

  React.useEffect(() => {
    if (!isPointerDown) return;

    const releasePointer = () => setIsPointerDown(false);
    window.addEventListener("pointerup", releasePointer, { once: true });
    window.addEventListener("pointercancel", releasePointer, { once: true });

    return () => {
      window.removeEventListener("pointerup", releasePointer);
      window.removeEventListener("pointercancel", releasePointer);
    };
  }, [isPointerDown]);

  return (
    <Carousel
      ref={carouselRef}
      setApi={setApi}
      opts={{ align: "start", loop: true, duration: 35 }}
      aria-label="Indicadores da pesquisa de consumo"
      className="mt-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHasFocus(false);
        }
      }}
      onPointerDownCapture={() => setIsPointerDown(true)}
    >
      <CarouselContent className="touch-pan-y">
        {consumerResearch.map((item, index) => {
          const Icon = consumerResearchIcons[index];
          return (
            <CarouselItem
              key={item.text}
              className="basis-full sm:basis-1/2 lg:basis-1/3"
              aria-label={`${index + 1} de ${consumerResearch.length}`}
            >
              <div className="reveal reveal-2 h-full">
                <Pill icon={Icon} value={item.value} text={item.text} />
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2" aria-label="Posição no carrossel">
          {consumerResearch.map((item, index) => (
            <button
              key={item.text}
              type="button"
              aria-label={`Ir para o indicador ${index + 1}`}
              aria-current={selectedIndex === index ? "true" : undefined}
              onClick={() => api?.scrollTo(index)}
              className={`h-2.5 rounded-full transition-[width,background-color] duration-300 ${
                selectedIndex === index
                  ? "w-7 bg-gold"
                  : "w-2.5 bg-off-white/25 hover:bg-off-white/50"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Indicador anterior"
            title="Indicador anterior"
            onClick={() => api?.scrollPrev()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Próximo indicador"
            title="Próximo indicador"
            onClick={() => api?.scrollNext()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </Carousel>
  );
}

export function Results() {
  const header = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const block1 = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const block3 = useReveal<HTMLDivElement>({ threshold: 0.15 });
  const block4 = useReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section
      id="resultados"
      className="relative overflow-hidden bg-navy text-off-white py-24 md:py-32"
    >
      {/* Subtle signal arcs — continuity with hero */}
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

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div ref={header.ref} data-visible={header.visible} className="reveal-root max-w-3xl">
          <div className="reveal reveal-1 font-mono text-sm text-gold tracking-wider">
            / RESULTADOS
          </div>
          <h2 className="reveal reveal-2 mt-3 font-display text-4xl md:text-5xl text-off-white">
            Não é estimativa. É auditado.
          </h2>
          <p className="reveal reveal-3 mt-5 text-off-white/70 text-base md:text-lg leading-relaxed">
            Os impactos da MOBTV são auditados pela Datavisiooh, empresa especializada em ciência de
            dados para o mercado publicitário. Câmeras instaladas nos painéis, associadas a
            Inteligência Artificial, fazem a contagem real de impactos e identificam perfil de faixa
            etária e sexo da audiência.
          </p>
        </div>

        {/* Block 1 — headline number */}
        <div ref={block1.ref} data-visible={block1.visible} className="reveal-root mt-20 md:mt-24">
          <div className="reveal reveal-1">
            <HeadlineNumber />
          </div>
        </div>

        {/* Block 2 — stats grid */}
        <div className="mt-16 md:mt-20">
          <StatsGrid />
        </div>

        {/* Block 3 — audience profile */}
        <div ref={block3.ref} data-visible={block3.visible} className="reveal-root mt-20 md:mt-24">
          <div className="reveal reveal-1 font-mono text-xs uppercase tracking-wider text-gold/80">
            / Perfil de audiência
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="reveal reveal-2">
              <AudienceCol
                title="Metrô e BRT"
                age={audienceProfile.metroBrt.age}
                female={audienceProfile.metroBrt.female}
                male={audienceProfile.metroBrt.male}
                time={audienceProfile.metroBrt.dwellTime}
                cats={audienceProfile.metroBrt.categories}
              />
            </div>
            <div className="reveal reveal-3">
              <AudienceCol
                title="UPAs e Hospitais"
                age={audienceProfile.upasHospitais.age}
                female={audienceProfile.upasHospitais.female}
                male={audienceProfile.upasHospitais.male}
                time={audienceProfile.upasHospitais.dwellTime}
                cats={audienceProfile.upasHospitais.categories}
              />
            </div>
          </div>
        </div>

        {/* Block 4 — consumer research pills */}
        <div ref={block4.ref} data-visible={block4.visible} className="reveal-root mt-20 md:mt-24">
          <div className="reveal reveal-1 font-mono text-xs uppercase tracking-wider text-gold/80">
            / Pesquisa de consumo
          </div>
          <ConsumerResearchCarousel />
        </div>
      </div>
    </section>
  );
}
