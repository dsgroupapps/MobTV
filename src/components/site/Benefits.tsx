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
} from "lucide-react";
import { useReveal } from "@/hooks/useReveal";
import { wifiAdsEfficiency, costComparison } from "@/data/mobtv-data";

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
    metric: wifiAdsEfficiency.viewability,
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
    metric: wifiAdsEfficiency.ctr,
    title: "CTR",
    desc: `Muito acima da média de mercado: ${wifiAdsEfficiency.ctrBenchmarkVideo} em vídeo e ${wifiAdsEfficiency.ctrBenchmarkBanner} em banner.`,
  },
];

const compare = costComparison;

export function Benefits() {
  const header = useReveal<HTMLDivElement>();
  const block1 = useReveal<HTMLDivElement>();
  const block2 = useReveal<HTMLDivElement>();
  const block3 = useReveal<HTMLDivElement>();

  return (
    <section
      id="beneficios"
      className="scroll-mt-24 bg-[var(--off-white)] text-[var(--ink)] py-24 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={header.ref} data-visible={header.visible} className="reveal-root max-w-3xl">
          <p className="reveal reveal-1 font-mono text-xs tracking-widest text-[var(--gold-deep)]">
            / BENEFÍCIOS
          </p>
          <h2 className="reveal reveal-2 font-display font-bold text-4xl md:text-5xl mt-3 text-[var(--ink)]">
            Uma rede de benefícios
          </h2>
          <p className="reveal reveal-3 mt-5 text-lg text-[var(--ink-soft)] leading-relaxed">
            Não basta conectar a população a um WiFi de qualidade. Antes da conexão, a pessoa é
            impactada por três telas — processo que chamamos de conexão de engajamento.
          </p>
        </div>

        {/* Block 1 — 5 perks strip */}
        <div ref={block1.ref} data-visible={block1.visible} className="reveal-root mt-16">
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
                  <span className="mt-3 font-medium text-[var(--ink)]">{p.label}</span>
                  {i < perks.length - 1 && (
                    <span className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-10 w-px bg-black/10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Block 2 — Efficiency cards */}
        <div ref={block2.ref} data-visible={block2.visible} className="reveal-root mt-20">
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
                  <p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Block 3 — Cost comparison */}
        <div ref={block3.ref} data-visible={block3.visible} className="reveal-root mt-20">
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
                <div className="font-display font-semibold text-xl text-[var(--ink)]">{c.name}</div>
                <dl className="mt-6 space-y-4 flex-1">
                  <div className="flex items-baseline justify-between border-b border-black/5 pb-3">
                    <dt className="font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">
                      {c.kpi}
                    </dt>
                    <dd className="font-mono text-lg text-[var(--ink)]">{c.kpiValue}</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-black/5 pb-3">
                    <dt className="font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">
                      Conversão
                    </dt>
                    <dd className="font-mono text-lg text-[var(--ink)]">{c.conv}</dd>
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
      </div>
    </section>
  );
}
