import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Minus, Plus, X, Check, ImageOff } from "lucide-react";
import {
  networkPoints,
  type Category,
  type CategoryKey,
  type NetworkPoint,
} from "@/data/network-points";
import {
  objetivos,
  regioesDisponiveis,
  midiaOptions,
  type MidiaOption,
} from "@/data/planner-options";
import { categoryIcon, PhotoFallback, MediaTypeChips, isCityMatch } from "./AssetExplorer";
import { pointMediaTypes } from "@/data/network-points";

const WHATSAPP_NUMBER = "5561992590234";

const STEP_LABELS = ["Objetivo", "Região", "Ambiente", "Mídia", "Pontos", "Resumo"] as const;

const categoryTabs: { key: CategoryKey; label: string }[] = [
  { key: "metro", label: "Estações de Metrô" },
  { key: "terminais", label: "Terminais Rodoviários" },
  { key: "upas", label: "UPAs" },
  { key: "hospitais", label: "Hospitais" },
  { key: "feiras", label: "Feiras" },
  { key: "restaurantes", label: "Restaurantes Comunitários" },
  { key: "servicos", label: "Serviços" },
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

function pointKey(categoria: CategoryKey, nome: string) {
  return `${categoria}::${nome}`;
}

/** Um ponto é elegível para a mídia escolhida com base no que a categoria realmente oferece. */
function mediaEligible(category: Category, midia: MidiaOption) {
  if (midia === "wifi") return true; // toda categoria tem WiFi Social (dual ou wifi-only)
  return category.connectivity === "dual"; // dooh e both exigem presença DOOH
}

type LineQty = {
  /** Uma quantidade de inserções (15s) por entrada em `point.produtos`. */
  produtoQtd: number[];
  /** Quantidade de engajamentos WiFi Ads (CPE). */
  engajamentos: number;
};

type SelectionMap = Record<string, LineQty>;

function initialQty(point: NetworkPoint, midia: MidiaOption): LineQty {
  const wantsDooh = midia === "dooh" || midia === "both";
  const wantsWifi = midia === "wifi" || midia === "both";
  return {
    produtoQtd: (point.produtos ?? []).map(() => (wantsDooh ? 1 : 0)),
    engajamentos: wantsWifi && point.valorPorCpe != null ? 100 : 0,
  };
}

type PointEntry = { point: NetworkPoint; category: Category };

function findPoint(key: string): PointEntry | undefined {
  for (const cat of networkPoints) {
    for (const p of cat.points) {
      if (pointKey(cat.key, p.nome) === key) return { point: p, category: cat };
    }
  }
  return undefined;
}

function pointSubtotal(point: NetworkPoint, qty: LineQty) {
  let total = 0;
  let semPreco = false;
  (point.produtos ?? []).forEach((p, i) => {
    const q = qty.produtoQtd[i] ?? 0;
    if (q <= 0) return;
    if (p.custoInsercao15s != null) total += p.custoInsercao15s * q;
    else semPreco = true;
  });
  if (qty.engajamentos > 0) {
    if (point.valorPorCpe != null) total += point.valorPorCpe * qty.engajamentos;
    else semPreco = true;
  }
  return { total, semPreco };
}

// ---------- UI primitives ----------

function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full bg-white/5 ring-1 ring-white/10 px-1 py-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-full text-off-white/70 hover:bg-white/10 hover:text-white transition-colors"
        aria-label="Diminuir"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2.4} />
      </button>
      <span className="font-mono text-sm tabular-nums text-white w-10 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + step)}
        className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-full text-off-white/70 hover:bg-white/10 hover:text-white transition-colors"
        aria-label="Aumentar"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
      </button>
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="sticky top-20 z-30 bg-navy/95 backdrop-blur-sm border-b border-white/8">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-off-white/50 mb-2.5">
          <span>
            Etapa {step + 1} de {STEP_LABELS.length}
          </span>
          <span className="text-gold">{STEP_LABELS[step]}</span>
        </div>
        <div className="flex gap-1.5">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-gold" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-gold text-navy shadow-[0_6px_20px_-6px_rgba(242,183,5,0.5)]"
          : "bg-white/5 text-white/75 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function StepShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-14 md:py-20">
      <div className="max-w-2xl">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold mb-4">{eyebrow}</div>
        <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-white/65 text-base md:text-lg leading-relaxed">{subtitle}</p>
        )}
      </div>
      <div className="mt-10">{children}</div>
    </div>
  );
}

function BottomNav({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  showBack = true,
  showNext = true,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
  showNext?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-30 bg-navy/95 backdrop-blur-sm border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer inline-flex items-center justify-center px-5 py-3 rounded-lg font-semibold text-off-white/70 hover:text-white transition-colors"
          >
            Voltar
          </button>
        ) : (
          <span />
        )}
        {showNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="btn-primary px-7 py-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gold"
          >
            {nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Main component ----------

export function CampaignPlanner({
  initialPoint,
}: {
  initialPoint?: { categoria: CategoryKey; nome: string };
}) {
  const seeded = useMemo(() => {
    if (!initialPoint) return null;
    const cat = networkPoints.find((c) => c.key === initialPoint.categoria);
    const point = cat?.points.find((p) => p.nome === initialPoint.nome);
    if (!cat || !point) return null;
    return { cat, point };
  }, [initialPoint]);

  const [step, setStep] = useState(0);

  // Cada etapa é uma tela nova — sem isso, trocar de etapa depois de rolar a
  // grade de pontos (etapa 5) deixaria a próxima etapa aberta no meio,
  // com a barra inferior fixa sobrepondo conteúdo em vez de aparecer só no
  // fim do scroll.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [regioes, setRegioes] = useState<string[]>([]);
  const [ambientes, setAmbientes] = useState<CategoryKey[]>(seeded ? [seeded.cat.key] : []);
  const [midia, setMidia] = useState<MidiaOption | null>(
    seeded ? (seeded.cat.connectivity === "dual" ? "both" : "wifi") : null,
  );
  const [selections, setSelections] = useState<SelectionMap>(() => {
    if (!seeded) return {};
    const midiaSeed: MidiaOption = seeded.cat.connectivity === "dual" ? "both" : "wifi";
    return { [pointKey(seeded.cat.key, seeded.point.nome)]: initialQty(seeded.point, midiaSeed) };
  });

  const toggleRegiao = (r: string) =>
    setRegioes((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const toggleAmbiente = (a: CategoryKey) =>
    setAmbientes((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const compatiblePoints = useMemo<PointEntry[]>(() => {
    if (!midia) return [];
    const cats =
      ambientes.length > 0 ? networkPoints.filter((c) => ambientes.includes(c.key)) : networkPoints;
    const out: PointEntry[] = [];
    for (const cat of cats) {
      if (!mediaEligible(cat, midia)) continue;
      for (const point of cat.points) {
        if (regioes.length > 0 && !regioes.some((r) => isCityMatch(point.nome, r))) continue;
        out.push({ point, category: cat });
      }
    }
    return out;
  }, [ambientes, regioes, midia]);

  const togglePointSelection = (entry: PointEntry) => {
    const key = pointKey(entry.category.key, entry.point.nome);
    setSelections((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = initialQty(entry.point, midia ?? "both");
      }
      return next;
    });
  };

  const updateQty = (key: string, updater: (q: LineQty) => LineQty) => {
    setSelections((prev) => (prev[key] ? { ...prev, [key]: updater(prev[key]) } : prev));
  };

  const selectedEntries = useMemo(
    () =>
      Object.keys(selections)
        .map((key) => ({ key, entry: findPoint(key), qty: selections[key] }))
        .filter((x): x is { key: string; entry: PointEntry; qty: LineQty } => x.entry != null),
    [selections],
  );

  const { total, semPrecoCount } = useMemo(() => {
    let t = 0;
    let sp = 0;
    for (const { entry, qty } of selectedEntries) {
      const { total: sub, semPreco } = pointSubtotal(entry.point, qty);
      t += sub;
      if (semPreco) sp += 1;
    }
    return { total: t, semPrecoCount: sp };
  }, [selectedEntries]);

  const objetivoLabel = objetivos.find((o) => o.value === objetivo)?.label ?? "";
  const midiaLabel = midiaOptions.find((m) => m.value === midia)?.label ?? "";
  const ambienteLabels =
    ambientes.length > 0
      ? categoryTabs.filter((t) => ambientes.includes(t.key)).map((t) => t.label)
      : ["Todos os ambientes"];
  const regiaoLabels = regioes.length > 0 ? regioes : ["Todas as regiões"];

  function buildProposalUrl() {
    const lines = [
      "Olá! Montei uma campanha no site da MOBTV.",
      "",
      `Objetivo: ${objetivoLabel}`,
      `Regiões: ${regiaoLabels.join(", ")}`,
      `Ambientes: ${ambienteLabels.join(", ")}`,
      `Mídia: ${midiaLabel}`,
      `Pontos (${selectedEntries.length}): ${selectedEntries.map((s) => s.entry.point.nome).join(", ")}`,
      `Investimento simulado: ${formatBRL(total)}${
        semPrecoCount > 0 ? ` (+ ${semPrecoCount} ponto(s) com valor sob consulta)` : ""
      }`,
      "",
      "Gostaria de receber uma proposta.",
    ];
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  const canNext =
    (step === 0 && objetivo != null) ||
    step === 1 ||
    step === 2 ||
    (step === 3 && midia != null) ||
    (step === 4 && selectedEntries.length > 0);

  const goNext = () => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <section className="bg-navy text-off-white min-h-screen flex flex-col">
      <ProgressBar step={step} />

      {/* pb reserva espaço para a barra inferior fixa (Voltar/Continuar) nunca
          cobrir o fim do conteúdo — ela fica grudada na base da viewport o
          tempo todo (padrão de barra de ação persistente), então o conteúdo
          precisa de folga extra abaixo, não só "crescer para preencher a tela". */}
      <div className="flex-1 pb-28">
        {step === 0 && (
          <StepShell
            eyebrow="/ ETAPA 1"
            title="Qual é o objetivo da campanha?"
            subtitle="Isso ajuda nosso time a entender o contexto — não muda o cálculo de investimento."
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {objetivos.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setObjetivo(o.value)}
                  className={`cursor-pointer text-left rounded-2xl p-6 ring-1 transition-all ${
                    objetivo === o.value
                      ? "bg-gold/10 ring-gold text-white"
                      : "bg-white/[0.03] ring-white/10 text-white/75 hover:bg-white/[0.06] hover:ring-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display font-semibold text-lg">{o.label}</span>
                    {objetivo === o.value && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-navy">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell
            eyebrow="/ ETAPA 2"
            title="Em quais regiões?"
            subtitle="Selecione uma ou mais cidades do inventário real da MOBTV. Nenhuma selecionada = todas as regiões."
          >
            <div className="flex flex-wrap gap-2.5">
              {regioesDisponiveis.map((r) => (
                <ToggleChip key={r} active={regioes.includes(r)} onClick={() => toggleRegiao(r)}>
                  {r}
                </ToggleChip>
              ))}
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            eyebrow="/ ETAPA 3"
            title="Em quais ambientes?"
            subtitle="Nenhum selecionado = todos os ambientes disponíveis."
          >
            <div className="flex flex-wrap gap-2.5">
              {categoryTabs.map((c) => (
                <ToggleChip
                  key={c.key}
                  active={ambientes.includes(c.key)}
                  onClick={() => toggleAmbiente(c.key)}
                >
                  {c.label}
                </ToggleChip>
              ))}
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell eyebrow="/ ETAPA 4" title="Qual mídia?">
            <div className="grid sm:grid-cols-3 gap-3">
              {midiaOptions.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMidia(m.value)}
                  className={`cursor-pointer text-left rounded-2xl p-6 ring-1 transition-all ${
                    midia === m.value
                      ? "bg-gold/10 ring-gold text-white"
                      : "bg-white/[0.03] ring-white/10 text-white/75 hover:bg-white/[0.06] hover:ring-white/20"
                  }`}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider ${
                      m.value === "wifi" ? "text-teal" : "text-gold"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${m.value === "wifi" ? "bg-teal" : "bg-gold"}`}
                    />
                    {m.value === "both" ? "DOOH · WiFi" : m.value.toUpperCase()}
                  </div>
                  <div className="mt-2 font-display font-semibold text-lg">{m.label}</div>
                  <div className="mt-1 text-sm text-white/55">{m.hint}</div>
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === 4 && (
          <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
            <div className="max-w-2xl">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold mb-4">
                / ETAPA 5
              </div>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight tracking-tight">
                Escolha os pontos
              </h2>
              <p className="mt-4 text-white/65 text-base md:text-lg leading-relaxed">
                {compatiblePoints.length} ponto{compatiblePoints.length === 1 ? "" : "s"} compatível
                {compatiblePoints.length === 1 ? "" : "eis"} com as escolhas anteriores. Clique para
                adicionar ou remover.
              </p>
            </div>

            <div className="mt-10 grid lg:grid-cols-[1fr_380px] gap-8 items-start">
              {/* Available points */}
              <div>
                {compatiblePoints.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {compatiblePoints.map((entry) => {
                      const key = pointKey(entry.category.key, entry.point.nome);
                      const isSelected = Boolean(selections[key]);
                      const Icon = categoryIcon[entry.category.key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => togglePointSelection(entry)}
                          className={`cursor-pointer group relative flex flex-col overflow-hidden rounded-2xl text-left ring-1 transition-all duration-200 ${
                            isSelected
                              ? "ring-2 ring-gold shadow-[0_0_0_4px_rgba(242,183,5,0.15)]"
                              : "ring-white/10 hover:ring-white/25"
                          } bg-[color-mix(in_oklab,var(--navy-soft)_55%,transparent)]`}
                        >
                          <div className="relative aspect-[16/10] w-full overflow-hidden">
                            {entry.point.images && entry.point.images.length > 0 ? (
                              <img
                                src={entry.point.images[0]}
                                alt={entry.point.nome}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <PhotoFallback Icon={Icon} />
                            )}
                            {isSelected && (
                              <span className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-navy shadow">
                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                              </span>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-off-white/45">
                              {entry.category.label}
                            </div>
                            <div className="mt-1.5 font-display text-[15px] font-semibold leading-snug text-white">
                              {entry.point.nome}
                            </div>
                            <div className="mt-2">
                              <MediaTypeChips types={pointMediaTypes(entry.point)} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/60">
                    <ImageOff className="mx-auto h-6 w-6 mb-3 opacity-50" strokeWidth={1.6} />
                    Nenhum ponto encontrado com essa combinação de região, ambiente e mídia. Volte e
                    ajuste os filtros.
                  </div>
                )}
              </div>

              {/* Selection sidebar */}
              <div className="lg:sticky lg:top-40 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-off-white/45 mb-4">
                  Sua seleção ({selectedEntries.length})
                </div>
                {selectedEntries.length === 0 ? (
                  <p className="text-sm text-white/50">Nenhum ponto selecionado ainda.</p>
                ) : (
                  <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1">
                    {selectedEntries.map(({ key, entry, qty }) => {
                      const { total: sub, semPreco } = pointSubtotal(entry.point, qty);
                      return (
                        <div
                          key={key}
                          className="border-b border-white/8 pb-4 last:border-b-0 last:pb-0"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-display text-sm font-semibold text-white leading-snug">
                              {entry.point.nome}
                            </div>
                            <button
                              type="button"
                              onClick={() => togglePointSelection(entry)}
                              aria-label={`Remover ${entry.point.nome}`}
                              className="cursor-pointer shrink-0 text-white/40 hover:text-red transition-colors"
                            >
                              <X className="h-4 w-4" strokeWidth={2} />
                            </button>
                          </div>

                          {entry.point.produtos?.map((p, i) => (
                            <div key={i} className="mt-3 flex items-center justify-between gap-3">
                              <div className="text-xs text-white/55">
                                {p.tipo} · inserções (15s)
                                {p.custoInsercao15s == null && (
                                  <div className="text-gold-deep">Valor sob consulta</div>
                                )}
                              </div>
                              <Stepper
                                value={qty.produtoQtd[i] ?? 0}
                                onChange={(v) =>
                                  updateQty(key, (q) => {
                                    const arr = [...q.produtoQtd];
                                    arr[i] = v;
                                    return { ...q, produtoQtd: arr };
                                  })
                                }
                              />
                            </div>
                          ))}

                          {entry.point.valorPorCpe != null &&
                            (midia === "wifi" || midia === "both") && (
                              <div className="mt-3 flex items-center justify-between gap-3">
                                <div className="text-xs text-white/55">Engajamentos WiFi (CPE)</div>
                                <Stepper
                                  value={qty.engajamentos}
                                  step={50}
                                  onChange={(v) =>
                                    updateQty(key, (q) => ({ ...q, engajamentos: v }))
                                  }
                                />
                              </div>
                            )}

                          <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-xs text-white/45">Subtotal</span>
                            <span className="font-mono text-sm text-gold">
                              {sub > 0 ? formatBRL(sub) : semPreco ? "Sob consulta" : "—"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedEntries.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-baseline justify-between">
                    <span className="font-mono text-xs uppercase tracking-wider text-off-white/60">
                      Total
                    </span>
                    <span className="font-mono text-lg text-gold tabular-nums">
                      {formatBRL(total)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <StepShell eyebrow="/ ETAPA 6" title="Sua campanha">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-6">
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-gold/80">
                      Objetivo
                    </dt>
                    <dd className="mt-1 text-white/85">{objetivoLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-gold/80">
                      Regiões
                    </dt>
                    <dd className="mt-1 text-white/85">{regiaoLabels.join(", ")}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-gold/80">
                      Ambientes
                    </dt>
                    <dd className="mt-1 text-white/85">{ambienteLabels.join(", ")}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-gold/80">
                      Mídia
                    </dt>
                    <dd className="mt-1 text-white/85">{midiaLabel}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-6">
                <div className="font-mono text-[11px] uppercase tracking-wider text-gold/80 mb-3">
                  Pontos selecionados ({selectedEntries.length})
                </div>
                <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedEntries.map(({ key, entry }) => (
                    <li key={key} className="text-sm text-white/85 flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-teal shrink-0" />
                      {entry.point.nome}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-gold/10 ring-1 ring-gold/30 p-6 md:p-8 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-gold mb-2">
                  Investimento calculável
                </div>
                <div className="font-display font-bold text-white text-3xl md:text-4xl tabular-nums">
                  {formatBRL(total)}
                </div>
                {semPrecoCount > 0 && (
                  <div className="mt-2 font-mono text-xs text-off-white/60">
                    + {semPrecoCount} item{semPrecoCount > 1 ? "s" : ""} sob consulta
                  </div>
                )}
              </div>
            </div>

            <p className="mt-6 text-sm text-white/55 leading-relaxed max-w-2xl">
              Esta é uma simulação de investimento com base na tabela comercial vigente.
              Disponibilidade, condições comerciais e valores finais são confirmados pela equipe
              MOBTV.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <a
                href={buildProposalUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-8 py-4 text-base inline-flex items-center justify-center"
              >
                Solicitar proposta
              </a>
              <button
                type="button"
                onClick={goBack}
                className="cursor-pointer font-semibold text-off-white/60 hover:text-white transition-colors"
              >
                Voltar
              </button>
            </div>
          </StepShell>
        )}
      </div>

      {/* Etapa 6 (Resumo) já tem seu próprio CTA e "Voltar" no corpo — uma
          barra fixa aqui só arriscaria cobrir o card de investimento em
          telas curtas, sem ganho real (a etapa não tem "próxima" ação). */}
      {step < 5 && (
        <BottomNav
          onBack={goBack}
          onNext={goNext}
          nextLabel={step === 4 ? "Ver resumo" : "Continuar"}
          nextDisabled={!canNext}
          showBack={step > 0}
        />
      )}
    </section>
  );
}
