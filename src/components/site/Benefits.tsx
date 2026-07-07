import { useEffect, useState } from "react";
import {
  KeyRound,
  Download,
  UserCheck,
  SlidersHorizontal,
  ShieldCheck,
  Eye,
  Repeat,
  ThumbsDown,
  MousePointerClick,
  Smile,
  Trophy,
  GraduationCap,
  HeartPulse,
  Film,
  Sparkles,
  Signal,
  Wifi,
  BatteryMedium,
} from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const perks = [
  { icon: KeyRound, label: "Sem Senha" },
  { icon: Download, label: "Sem Baixar App" },
  { icon: UserCheck, label: "Registro de Clientes" },
  { icon: SlidersHorizontal, label: "Controle" },
  { icon: ShieldCheck, label: "Segurança" },
];

const efficiency = [
  {
    icon: Eye,
    metric: "100%",
    title: "Viewability",
    desc: "Só são computados engajamentos entregues 100%.",
  },
  {
    icon: Repeat,
    metric: "Recall",
    title: "Recall Maximizado",
    desc: "Wi-Fi gratuito + múltiplas exposições geram recall muito maior.",
  },
  {
    icon: ThumbsDown,
    metric: "↓ Rejeição",
    title: "Baixa Rejeição",
    desc: "Internet gratuita após a mídia garante rejeição muito menor.",
  },
  {
    icon: MousePointerClick,
    metric: ">65%",
    title: "CTR",
    desc: "Muito acima da média de mercado: 2,7% em vídeo e 0,4% em banner.",
  },
];

const compare = [
  {
    name: "Banner Display",
    kpi: "CPM",
    kpiValue: "R$ 25,00",
    conv: "0,04%",
    invest: "R$ 62.500,00",
    highlight: false,
  },
  {
    name: "Video Ads",
    kpi: "CPM",
    kpiValue: "R$ 250,00",
    conv: "2,7%",
    invest: "R$ 9.259,26",
    highlight: false,
  },
  {
    name: "Wi-Fi Ads MOBTV",
    kpi: "CPE",
    kpiValue: "R$ 8,00",
    conv: "100%",
    invest: "R$ 8.000,00",
    highlight: true,
  },
];

const categories = [
  { icon: Smile, title: "Humor", desc: "Vídeos de humor para descontrair." },
  { icon: Trophy, title: "Esportes", desc: "Últimas notícias, jogadas e curiosidades." },
  { icon: GraduationCap, title: "Educação e Trabalho", desc: "Conteúdo para estudar e se preparar para o mercado." },
  { icon: HeartPulse, title: "Saúde e Beleza", desc: "Dicas para melhorar a qualidade de vida." },
  { icon: Film, title: "Entretenimento", desc: "Filmes, séries e muito mais." },
  { icon: Sparkles, title: "Personalizado", desc: "Menu sob medida para a necessidade do cliente." },
];

const SLIDE_MS = 2500;

export function Benefits() {
  const header = useReveal<HTMLDivElement>();
  const block1 = useReveal<HTMLDivElement>();
  const block2 = useReveal<HTMLDivElement>();
  const block3 = useReveal<HTMLDivElement>();
  const block4 = useReveal<HTMLDivElement>();

  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % categories.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, []);


  return (
    <section
      id="beneficios"
      className="scroll-mt-24 bg-[var(--off-white)] text-[var(--ink)] py-24 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div
          ref={header.ref}
          data-visible={header.visible}
          className="reveal-root max-w-3xl"
        >
          <p className="reveal reveal-1 font-mono text-xs tracking-widest text-[var(--gold-deep)]">
            / BENEFÍCIOS
          </p>
          <h2 className="reveal reveal-2 font-display font-bold text-4xl md:text-5xl mt-3 text-[var(--ink)]">
            Uma rede de benefícios
          </h2>
          <p className="reveal reveal-3 mt-5 text-lg text-[var(--ink-soft)] leading-relaxed">
            Não basta conectar a população a um WiFi de qualidade. Antes da
            conexão, a pessoa é impactada por três telas — processo que
            chamamos de conexão de engajamento.
          </p>
        </div>

        {/* Block 1 — 5 perks strip */}
        <div
          ref={block1.ref}
          data-visible={block1.visible}
          className="reveal-root mt-16"
        >
          <div className="flex flex-wrap items-center justify-between gap-y-8 rounded-2xl bg-white border border-black/5 shadow-sm px-6 py-8">
            {perks.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.label}
                  className={`reveal reveal-${Math.min(i + 1, 5)} flex-1 min-w-[140px] flex flex-col items-center text-center px-2 relative`}
                >
                  <div className="w-14 h-14 rounded-full bg-white border border-[var(--gold)]/40 flex items-center justify-center shadow-sm">
                    <Icon className="w-6 h-6 text-[var(--gold-deep)]" />
                  </div>
                  <span className="mt-3 font-medium text-[var(--ink)]">
                    {p.label}
                  </span>
                  {i < perks.length - 1 && (
                    <span className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-10 w-px bg-black/10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Block 2 — Efficiency cards */}
        <div
          ref={block2.ref}
          data-visible={block2.visible}
          className="reveal-root mt-20"
        >
          <h3 className="reveal reveal-1 font-display text-2xl md:text-3xl font-semibold text-[var(--ink)]">
            Eficiência acima da média
          </h3>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {efficiency.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className={`reveal reveal-${Math.min(i + 1, 5)} bg-white rounded-xl border-t-[3px] border-t-[var(--gold)] border border-black/5 shadow-sm p-6 flex flex-col`}
                >
                  <Icon className="w-6 h-6 text-[var(--gold-deep)]" />
                  <div className="mt-4 font-display font-bold text-3xl md:text-4xl text-[var(--ink)] leading-tight">
                    {c.metric}
                  </div>
                  <div className="mt-1 font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">
                    {c.title}
                  </div>
                  <p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">
                    {c.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Block 3 — Cost comparison */}
        <div
          ref={block3.ref}
          data-visible={block3.visible}
          className="reveal-root mt-20"
        >
          <h3 className="reveal reveal-1 font-display text-2xl md:text-3xl font-semibold text-[var(--ink)]">
            Compare o custo x benefício
          </h3>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {compare.map((c, i) => (
              <div
                key={c.name}
                className={`reveal reveal-${Math.min(i + 1, 5)} relative rounded-xl bg-white p-6 flex flex-col ${
                  c.highlight
                    ? "border-2 border-[var(--gold)] shadow-xl md:-translate-y-2 benefit-highlight"
                    : "border border-black/10 shadow-sm"
                }`}
              >
                {c.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--gold)] text-[var(--ink)] text-xs font-semibold font-mono px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                    Melhor custo-benefício
                  </div>
                )}
                <div className="font-display font-semibold text-xl text-[var(--ink)]">
                  {c.name}
                </div>
                <dl className="mt-6 space-y-4 flex-1">
                  <div className="flex items-baseline justify-between border-b border-black/5 pb-3">
                    <dt className="font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">
                      {c.kpi}
                    </dt>
                    <dd className="font-mono text-lg text-[var(--ink)]">
                      {c.kpiValue}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-black/5 pb-3">
                    <dt className="font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">
                      Conversão
                    </dt>
                    <dd className="font-mono text-lg text-[var(--ink)]">
                      {c.conv}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">
                      Investimento p/ mil engajamentos
                    </dt>
                    <dd
                      className={`mt-1 font-display font-bold text-2xl ${
                        c.highlight ? "text-[var(--gold-deep)]" : "text-[var(--ink)]"
                      }`}
                    >
                      {c.invest}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>

        {/* Block 4 — Menu de Conteúdos */}
        <div
          ref={block4.ref}
          data-visible={block4.visible}
          className="reveal-root mt-24"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Phone mockup */}
            <div className="reveal reveal-1 lg:col-span-5 flex justify-center">
              <div className="relative w-[310px] h-[620px] rounded-[3rem] bg-[var(--navy)] p-3 shadow-2xl phone-glow">
                {/* Notch with live indicator */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-20 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] phone-live" />
                </div>

                {/* Screen */}
                <div className="relative w-full h-full rounded-[2.4rem] bg-gradient-to-br from-[var(--navy)] to-[var(--indigo)] overflow-hidden">
                  {/* Fake status bar */}
                  <div className="absolute top-0 left-0 right-0 h-8 px-6 pt-2 flex items-center justify-between text-[var(--off-white)]/70 z-10">
                    <span className="font-mono text-[10px] tracking-wider">
                      9:41
                    </span>
                    <div className="flex items-center gap-1">
                      <Signal className="w-3 h-3" />
                      <Wifi className="w-3 h-3" />
                      <BatteryMedium className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Header */}
                  <div className="absolute top-10 left-0 right-0 px-6 text-center">
                    <div className="font-mono text-[10px] tracking-widest text-[var(--gold)]/80 uppercase">
                      Menu MOBTV
                    </div>
                    <div className="mt-1 font-display font-bold text-[var(--off-white)] text-base">
                      Conteúdos
                    </div>
                  </div>

                  {/* Category slides */}
                  <div className="absolute inset-0 flex items-center justify-center pt-16 pb-12">
                    {categories.map((c, i) => {
                      const Icon = c.icon;
                      const isActive = i === activeIdx;
                      return (
                        <div
                          key={c.title}
                          className={`absolute inset-x-6 top-24 bottom-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center p-6 transition-all duration-500 ease-out ${
                            isActive
                              ? "opacity-100 scale-100 translate-y-0"
                              : "opacity-0 scale-95 translate-y-4 pointer-events-none"
                          }`}
                        >
                          <div className="w-20 h-20 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/40 flex items-center justify-center">
                            <Icon className="w-10 h-10 text-[var(--gold)]" />
                          </div>
                          <div className="mt-5 font-display font-bold text-[var(--off-white)] text-lg text-center">
                            {c.title}
                          </div>
                          <div className="mt-2 font-mono text-[10px] tracking-wider text-[var(--off-white)]/50">
                            {String(i + 1).padStart(2, "0")} / {String(categories.length).padStart(2, "0")}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress bar */}
                  <div className="absolute bottom-4 left-6 right-6 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      key={activeIdx}
                      className="h-full bg-[var(--gold)] phone-progress"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: intro + grid */}
            <div className="lg:col-span-7">
              <p className="reveal reveal-2 text-lg text-[var(--ink-soft)] leading-relaxed">
                A MOBTV conta com exclusividade de um Menu de Conteúdos — um
                canal multiplataforma com entretenimento, humor, esportes,
                saúde e educação. Também é possível desenvolver um menu 100%
                personalizado de acordo com a necessidade de cada cliente.
              </p>
              <div className="reveal reveal-3 mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((c, i) => {
                  const Icon = c.icon;
                  const isActive = i === activeIdx;
                  return (
                    <div
                      key={c.title}
                      className={`bg-white rounded-lg shadow-sm p-4 transition-all duration-300 ${
                        isActive
                          ? "border-2 border-[var(--gold)] shadow-md -translate-y-1"
                          : "border border-black/5 hover:-translate-y-1"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isActive
                            ? "bg-[var(--gold)]/25 border border-[var(--gold)]"
                            : "bg-[var(--gold)]/10 border border-[var(--gold)]/30"
                        }`}
                      >
                        <Icon className="w-5 h-5 text-[var(--gold-deep)]" />
                      </div>
                      <div className="mt-3 font-display font-semibold text-[var(--ink)]">
                        {c.title}
                      </div>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">
                        {c.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
