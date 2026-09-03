import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ImageOff, X } from "lucide-react";
import {
  networkPoints,
  pointMediaTypes,
  type CategoryKey,
  type MediaTypeKey,
  type NetworkPoint,
} from "@/data/network-points";
import { midiaOptions, type MidiaOption } from "@/data/planner-options";
import { regionSummaries } from "@/data/df-regions";
import { categoryIcon, MediaTypeChips, mediaTypeMeta } from "./MediaBadges";
import { PhotoFallback } from "./AssetExplorer";
import { PlannerMediaPicker } from "./PlannerMediaPicker";
import { PointAudiencePanel } from "./PointAudiencePanel";
import { CampaignAudienceSummary } from "./CampaignAudienceSummary";
import { loadPlannerState, savePlannerState } from "@/lib/planner/storage";
import {
  clampSimInput,
  getPointIntelligence,
  rollupCampaignAudience,
  SIM_LIMITS,
  type CampaignSimInput,
  type LedPointIntelligence,
} from "@/lib/planner/audience";
import { trackFunnel } from "@/lib/analytics/funnel";
import { MEDIA_SELECT_TOKEN } from "@/lib/analytics/types";

const WHATSAPP_NUMBER = "5561992590234";

const STEP_LABELS = ["Mídia", "Pontos", "Resumo"] as const;

const mediaIntentCopy: Record<
  MidiaOption,
  { eyebrow: string; description: string; types: MediaTypeKey[] }
> = {
  dooh: {
    eyebrow: "Telas e painéis",
    description: "Pontos com Tela ou Painel LED disponíveis no inventário.",
    types: ["screen", "led"],
  },
  wifi: {
    eyebrow: "Conectividade",
    description: "Pontos com mídia WiFi Ads confirmada no catálogo.",
    types: ["wifi"],
  },
  both: {
    eyebrow: "Cobertura combinada",
    description: "Inventário combinado: pontos com DOOH, WiFi Ads ou as duas frentes.",
    types: ["screen", "led", "wifi"],
  },
};

function pointKey(categoria: CategoryKey, nome: string) {
  return `${categoria}::${nome}`;
}

function hasDooh(types: MediaTypeKey[]) {
  return types.includes("screen") || types.includes("led");
}

function mediaEligible(point: NetworkPoint, midia: MidiaOption) {
  const types = pointMediaTypes(point);
  if (midia === "dooh") return hasDooh(types);
  if (midia === "wifi") return types.includes("wifi");
  return hasDooh(types) || types.includes("wifi");
}

/** key do ponto (`${categoria}::${nome}`) -> mídias escolhidas nele (nunca vazio). */
type SelectionMap = Record<string, MediaTypeKey[]>;

type PointEntry = { point: NetworkPoint; categoryKey: CategoryKey; categoryLabel: string };

type MediaPickerTarget = {
  key: string;
  entry: PointEntry;
  /** mídias oferecidas pelo ponto — nada fora disso é selecionável */
  available: MediaTypeKey[];
  /** pré-seleção (edição); vazio na adição */
  initial: MediaTypeKey[];
  mode: "add" | "edit";
};

/** "Tela + WiFi Ads" — para o resumo e a mensagem de proposta. */
function mediaLabelList(media: MediaTypeKey[]) {
  return media.map((m) => mediaTypeMeta[m].label).join(" + ");
}

function findPoint(key: string): PointEntry | undefined {
  for (const cat of networkPoints) {
    for (const p of cat.points) {
      if (pointKey(cat.key, p.nome) === key) {
        return { point: p, categoryKey: cat.key, categoryLabel: cat.label };
      }
    }
  }
  return undefined;
}

function initialMediaForPoint(point: NetworkPoint): MidiaOption {
  const types = pointMediaTypes(point);
  if (hasDooh(types) && types.includes("wifi")) return "both";
  if (hasDooh(types)) return "dooh";
  return "wifi";
}

// ---------- UI primitives ----------

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="sticky top-20 z-30 border-b border-white/8 bg-navy/95 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-6 py-4">
        <div className="mb-2.5 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-off-white/50">
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
    <div className="mx-auto max-w-5xl px-6 py-14 md:py-20">
      <div className="max-w-2xl">
        <div className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-gold">{eyebrow}</div>
        <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-base leading-relaxed text-white/65 md:text-lg">{subtitle}</p>
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
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-white/10 bg-navy/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg px-5 py-3 font-semibold text-off-white/70 transition-colors hover:text-white"
          >
            Voltar
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="btn-primary px-7 py-3 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gold"
        >
          {nextLabel}
        </button>
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

  const [step, setStep] = useState(seeded ? 1 : 0);
  const [midia, setMidia] = useState<MidiaOption | null>(
    seeded ? initialMediaForPoint(seeded.point) : null,
  );
  const [regionFilter, setRegionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey | "all">("all");
  const [selections, setSelections] = useState<SelectionMap>(() => {
    if (!seeded) return {};
    // Seed vindo de /rede (?ponto=&categoria=): ponto de mídia única entra
    // direto; ponto multimídia fica de fora até o usuário escolher no picker
    // (aberto pelo efeito de hidratação abaixo).
    const key = pointKey(seeded.cat.key, seeded.point.nome);
    const available = pointMediaTypes(seeded.point);
    return available.length === 1 ? { [key]: available } : {};
  });
  const [mediaPicker, setMediaPicker] = useState<MediaPickerTarget | null>(null);
  const [sim, setSim] = useState<CampaignSimInput>(() => ({
    days: SIM_LIMITS.days.default,
    insertionsPerDay: SIM_LIMITS.insertionsPerDay.default,
  }));
  const hydratedRef = useRef(false);

  // --- Funil de jornada (compartilha anonymous_session_id + initial_point_slug) ---
  const plannerStartedRef = useRef(false);
  const summaryViewedRef = useRef(false);

  const firePlannerStart = (intent?: MidiaOption | null) => {
    if (plannerStartedRef.current) return;
    plannerStartedRef.current = true;
    trackFunnel("planner_start", { planningIntent: intent ?? undefined });
  };

  const firePointAdd = (entry: PointEntry, media: MediaTypeKey[]) => {
    trackFunnel("planner_point_add", {
      pointSlug: entry.point.slug,
      pointName: entry.point.nome,
      categoryKey: entry.categoryKey,
    });
    for (const m of media) {
      trackFunnel("planner_media_select", {
        pointSlug: entry.point.slug,
        pointName: entry.point.nome,
        categoryKey: entry.categoryKey,
        mediaType: MEDIA_SELECT_TOKEN[m],
      });
    }
  };

  useEffect(() => {
    trackFunnel("planner_open", { planningIntent: midia ?? undefined });
    // Quem chega já na etapa 2 (seed do /rede) também "começou" o planejador.
    if (seeded) firePlannerStart(midia);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === 2 && !summaryViewedRef.current) {
      summaryViewedRef.current = true;
      trackFunnel("planner_summary_view", { planningIntent: midia ?? undefined });
    }
  }, [step, midia]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // Hidratação única: restaura a sessão anterior (sessionStorage) e concilia
  // com o seed do /rede. Compatível com estado antigo sem mídia — sanitiza
  // contra os produtos reais do ponto e nunca escolhe uma mídia arbitrária
  // para pontos multimídia.
  useEffect(() => {
    const stored = loadPlannerState();

    const restored: SelectionMap = {};
    if (stored) {
      for (const sel of stored.selections) {
        const found = findPoint(sel.key);
        if (!found) continue;
        const offered = pointMediaTypes(found.point);
        let media = sel.media.filter((m) => offered.includes(m));
        if (media.length === 0) {
          if (offered.length === 1)
            media = offered; // única opção → seguro
          else continue; // multimídia sem escolha salva → pede de novo ao voltar
        }
        restored[sel.key] = media;
      }
    }

    let seedPicker: MediaPickerTarget | null = null;
    if (seeded) {
      const key = pointKey(seeded.cat.key, seeded.point.nome);
      const available = pointMediaTypes(seeded.point);
      if (!restored[key] && available.length > 1) {
        seedPicker = {
          key,
          entry: {
            point: seeded.point,
            categoryKey: seeded.cat.key,
            categoryLabel: seeded.cat.label,
          },
          available,
          initial: [],
          mode: "add",
        };
      }
    }

    if (Object.keys(restored).length > 0) {
      setSelections((prev) => ({ ...restored, ...prev }));
    }
    if (!seeded && stored) {
      if (stored.midia) setMidia(stored.midia);
      let target = stored.step ?? 0;
      if (target >= 1 && !stored.midia) target = 0;
      if (target >= 2 && Object.keys(restored).length === 0) target = 1;
      setStep(Math.max(0, Math.min(STEP_LABELS.length - 1, target)));
    }
    if (seedPicker) setMediaPicker(seedPicker);
    if (stored?.sim) setSim(clampSimInput(stored.sim));

    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persiste (sessionStorage) — só depois da hidratação, para não sobrescrever
  // a sessão restaurada com o estado inicial.
  useEffect(() => {
    if (!hydratedRef.current) return;
    savePlannerState({
      midia,
      step,
      selections: Object.entries(selections).map(([key, media]) => ({ key, media })),
      sim,
    });
  }, [midia, step, selections, sim]);

  const regionPointNames = useMemo(
    () => new Map(regionSummaries.map((r) => [r.region, new Set(r.pointNames)])),
    [],
  );

  const regionOptions = useMemo(() => regionSummaries.map((r) => r.region), []);
  const categoryOptions = useMemo(
    () => networkPoints.map((cat) => ({ key: cat.key, label: cat.label })),
    [],
  );

  const allMediaCompatiblePoints = useMemo<PointEntry[]>(() => {
    if (!midia) return [];
    const out: PointEntry[] = [];
    for (const cat of networkPoints) {
      for (const point of cat.points) {
        if (mediaEligible(point, midia)) {
          out.push({ point, categoryKey: cat.key, categoryLabel: cat.label });
        }
      }
    }
    return out;
  }, [midia]);

  const visiblePoints = useMemo(() => {
    return allMediaCompatiblePoints.filter((entry) => {
      if (categoryFilter !== "all" && entry.categoryKey !== categoryFilter) return false;
      if (regionFilter !== "all") {
        const pointNames = regionPointNames.get(regionFilter);
        if (!pointNames?.has(entry.point.nome)) return false;
      }
      return true;
    });
  }, [allMediaCompatiblePoints, categoryFilter, regionFilter, regionPointNames]);

  const selectedEntries = useMemo(
    () =>
      Object.entries(selections)
        .map(([key, media]) => ({ key, media, entry: findPoint(key) }))
        .filter(
          (x): x is { key: string; media: MediaTypeKey[]; entry: PointEntry } => x.entry != null,
        ),
    [selections],
  );

  // Inteligência de audiência — SÓ para pontos com `Painel LED` selecionado
  // que têm dados auditados (`point-audience-data.ts`). Trocar a mídia do
  // ponto para Tela/WiFi remove o ponto daqui automaticamente.
  const ledIntel = useMemo(() => {
    const list: { slug: string; name: string; intelligence: LedPointIntelligence }[] = [];
    for (const [key, media] of Object.entries(selections)) {
      if (!media.includes("led")) continue;
      const entry = findPoint(key);
      if (!entry) continue;
      const intelligence = getPointIntelligence(entry.point.slug, media);
      if (intelligence) {
        list.push({ slug: entry.point.slug, name: entry.point.nome, intelligence });
      }
    }
    return list;
  }, [selections]);

  const ledBySlug = useMemo(
    () => new Map(ledIntel.map((x) => [x.slug, x.intelligence])),
    [ledIntel],
  );
  const ledRollup = useMemo(() => rollupCampaignAudience(ledIntel), [ledIntel]);

  const hasActiveFilters = regionFilter !== "all" || categoryFilter !== "all";
  const midiaLabel = midiaOptions.find((m) => m.value === midia)?.label ?? "";

  const selectMedia = (value: MidiaOption) => {
    firePlannerStart(value);
    setMidia(value);
    setSelections((prev) => {
      const next: SelectionMap = {};
      for (const [key, media] of Object.entries(prev)) {
        const entry = findPoint(key);
        if (!entry || !mediaEligible(entry.point, value)) continue;
        // Mantém só mídias que o ponto realmente oferece (validação — a
        // intenção dooh/wifi/both é lente de descoberta, não filtro de chip).
        const offered = pointMediaTypes(entry.point);
        const kept = media.filter((m) => offered.includes(m));
        if (kept.length > 0) next[key] = kept;
      }
      return next;
    });
    setStep(1);
  };

  const removePoint = (key: string) => {
    setSelections((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Clique no card da etapa 2: já selecionado -> remove; mídia única -> adiciona
  // direto; 2+ mídias -> abre o picker.
  const handlePointClick = (entry: PointEntry) => {
    const key = pointKey(entry.categoryKey, entry.point.nome);
    if (selections[key]) {
      removePoint(key);
      return;
    }
    const available = pointMediaTypes(entry.point);
    if (available.length <= 1) {
      setSelections((prev) => ({ ...prev, [key]: available }));
      firePointAdd(entry, available);
      return;
    }
    setMediaPicker({ key, entry, available, initial: [], mode: "add" });
  };

  const openEditPicker = (key: string, entry: PointEntry) => {
    setMediaPicker({
      key,
      entry,
      available: pointMediaTypes(entry.point),
      initial: selections[key] ?? [],
      mode: "edit",
    });
  };

  const commitMediaPicker = (media: MediaTypeKey[]) => {
    if (!mediaPicker || media.length === 0) return;
    const chosen = mediaPicker.available.filter((m) => media.includes(m));
    const isNewPoint = mediaPicker.mode === "add";
    setSelections((prev) => ({ ...prev, [mediaPicker.key]: chosen }));
    if (isNewPoint) {
      firePointAdd(mediaPicker.entry, chosen);
    } else {
      // Edição de mídia de um ponto já no planejador — só media_select.
      for (const m of chosen) {
        trackFunnel("planner_media_select", {
          pointSlug: mediaPicker.entry.point.slug,
          pointName: mediaPicker.entry.point.nome,
          categoryKey: mediaPicker.entry.categoryKey,
          mediaType: MEDIA_SELECT_TOKEN[m],
        });
      }
    }
    setMediaPicker(null);
  };

  const clearFilters = () => {
    setRegionFilter("all");
    setCategoryFilter("all");
  };

  function buildProposalUrl() {
    const lines = [
      "Olá! Montei uma campanha no site da MOBTV.",
      "",
      `Mídia: ${midiaLabel}`,
      `Pontos (${selectedEntries.length}):`,
      ...selectedEntries.map((s) => `• ${s.entry.point.nome} — ${mediaLabelList(s.media)}`),
      "",
      "Gostaria de receber uma proposta comercial.",
    ];
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  const canNext = (step === 0 && midia != null) || (step === 1 && selectedEntries.length > 0);
  const goNext = () => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <section className="flex min-h-screen flex-col bg-navy text-off-white">
      <ProgressBar step={step} />

      <div className="flex-1 pb-28">
        {step === 0 && (
          <StepShell
            eyebrow="/ ETAPA 1"
            title="Como você quer impactar seu público?"
            subtitle="Escolha a frente principal da campanha. Em seguida, você verá todos os pontos compatíveis."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {midiaOptions.map((m) => {
                const meta = mediaIntentCopy[m.value];
                const selected = midia === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    data-media-option={m.value}
                    onClick={() => selectMedia(m.value)}
                    className={`group cursor-pointer rounded-2xl p-6 text-left ring-1 transition-all ${
                      selected
                        ? "bg-gold/10 text-white ring-gold"
                        : "bg-white/[0.03] text-white/75 ring-white/10 hover:bg-white/[0.06] hover:text-white hover:ring-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div
                          className={`font-mono text-[10px] uppercase tracking-[0.22em] ${
                            m.value === "wifi" ? "text-teal" : "text-gold"
                          }`}
                        >
                          {meta.eyebrow}
                        </div>
                        <div className="mt-3 font-display text-2xl font-bold leading-tight">
                          {m.label}
                        </div>
                      </div>
                      {selected && (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-navy">
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="mt-4 min-h-12 text-sm leading-relaxed text-white/58">
                      {meta.description}
                    </p>
                    <div className="mt-5">
                      <MediaTypeChips types={meta.types} />
                    </div>
                  </button>
                );
              })}
            </div>
          </StepShell>
        )}

        {step === 1 && (
          <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
            <div className="max-w-2xl">
              <div className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-gold">
                / ETAPA 2
              </div>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                Escolha os pontos
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/65 md:text-lg">
                {hasActiveFilters
                  ? `${visiblePoints.length} ponto${visiblePoints.length === 1 ? "" : "s"} encontrado${
                      visiblePoints.length === 1 ? "" : "s"
                    }`
                  : `${allMediaCompatiblePoints.length} ponto${
                      allMediaCompatiblePoints.length === 1 ? "" : "s"
                    } disponível${allMediaCompatiblePoints.length === 1 ? "" : "is"}`}
                . Clique para adicionar ou remover.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-off-white/45">
                  Região
                </span>
                <select
                  data-region-filter
                  value={regionFilter}
                  onChange={(event) => setRegionFilter(event.target.value)}
                  className="h-11 w-full cursor-pointer rounded-lg border border-white/10 bg-navy px-3 font-mono text-xs uppercase tracking-wider text-white outline-none transition-colors hover:border-white/20 focus:border-gold"
                >
                  <option value="all">Todas as regiões</option>
                  {regionOptions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-off-white/45">
                  Ambiente
                </span>
                <select
                  data-category-filter
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value as CategoryKey | "all")}
                  className="h-11 w-full cursor-pointer rounded-lg border border-white/10 bg-navy px-3 font-mono text-xs uppercase tracking-wider text-white outline-none transition-colors hover:border-white/20 focus:border-gold"
                >
                  <option value="all">Todos os ambientes</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </label>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-11 shrink-0 cursor-pointer rounded-lg px-4 font-mono text-[11px] uppercase tracking-wider text-gold transition-colors hover:bg-white/5"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
              <div>
                {visiblePoints.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visiblePoints.map((entry) => {
                      const key = pointKey(entry.categoryKey, entry.point.nome);
                      const selectedMedia = selections[key];
                      const isSelected = selectedMedia != null;
                      const Icon = categoryIcon[entry.categoryKey];
                      return (
                        <button
                          key={key}
                          type="button"
                          data-point-card
                          data-point-name={entry.point.nome}
                          data-point-category={entry.categoryKey}
                          data-selected={isSelected ? "true" : "false"}
                          data-selected-media={isSelected ? selectedMedia.join(",") : undefined}
                          onClick={() => handlePointClick(entry)}
                          className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-[color-mix(in_oklab,var(--navy-soft)_55%,transparent)] text-left ring-1 transition-all duration-200 ${
                            isSelected
                              ? "ring-2 ring-gold shadow-[0_0_0_4px_rgba(242,183,5,0.15)]"
                              : "ring-white/10 hover:ring-white/25"
                          }`}
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
                              <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-navy shadow">
                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                              </span>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-off-white/45">
                              {entry.categoryLabel}
                            </div>
                            <div className="mt-1.5 font-display text-[15px] font-semibold leading-snug text-white">
                              {entry.point.nome}
                            </div>
                            <div className="mt-2">
                              <MediaTypeChips
                                types={pointMediaTypes(entry.point)}
                                selected={isSelected ? selectedMedia : undefined}
                              />
                            </div>
                            {isSelected && pointMediaTypes(entry.point).length > 1 && (
                              <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-gold/70">
                                Editar mídia em “Sua seleção” →
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/60">
                    <ImageOff className="mx-auto mb-3 h-6 w-6 opacity-50" strokeWidth={1.6} />
                    Nenhum ponto encontrado com essa combinação de filtros.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 lg:sticky lg:top-40">
                <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-off-white/45">
                  Sua seleção ({selectedEntries.length})
                </div>
                {selectedEntries.length === 0 ? (
                  <p className="text-sm text-white/50">Nenhum ponto selecionado ainda.</p>
                ) : (
                  <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
                    {selectedEntries.map(({ key, entry, media }) => {
                      const offered = pointMediaTypes(entry.point);
                      const canEditMedia = offered.length > 1;
                      return (
                        <div
                          key={key}
                          data-selection-item
                          data-point-name={entry.point.nome}
                          data-selected-media={media.join(",")}
                          className="border-b border-white/8 pb-3 last:border-b-0 last:pb-0"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-display text-sm font-semibold leading-snug text-white">
                                {entry.point.nome}
                              </div>
                              <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-off-white/40">
                                {entry.categoryLabel}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePoint(key)}
                              aria-label={`Remover ${entry.point.nome}`}
                              className="shrink-0 cursor-pointer text-white/40 transition-colors hover:text-red"
                            >
                              <X className="h-4 w-4" strokeWidth={2} />
                            </button>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <MediaTypeChips types={offered} selected={media} />
                            {canEditMedia && (
                              <button
                                type="button"
                                data-edit-media
                                onClick={() => openEditPicker(key, entry)}
                                className="shrink-0 cursor-pointer font-mono text-[10px] uppercase tracking-wider text-gold/80 transition-colors hover:text-gold"
                              >
                                Editar mídia
                              </button>
                            )}
                          </div>
                          {ledBySlug.has(entry.point.slug) && (
                            <details data-audience-disclosure className="group mt-2">
                              <summary className="cursor-pointer list-none font-mono text-[10px] uppercase tracking-wider text-gold/80 transition-colors hover:text-gold">
                                <span className="group-open:hidden">Ver audiência do ponto →</span>
                                <span className="hidden group-open:inline">
                                  Ocultar audiência ↑
                                </span>
                              </summary>
                              <div className="mt-3">
                                <PointAudiencePanel
                                  dense
                                  intelligence={ledBySlug.get(entry.point.slug)!}
                                  pointName={entry.point.nome}
                                />
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <StepShell
            eyebrow="/ ETAPA 3"
            title="Resumo da campanha"
            subtitle="Revise os pontos selecionados e envie sua solicitação para a equipe comercial."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/10">
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-gold/80">
                      Mídia
                    </dt>
                    <dd className="mt-1 text-white/85">{midiaLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-gold/80">
                      Pontos selecionados
                    </dt>
                    <dd className="mt-1 text-white/85">{selectedEntries.length}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/10">
                <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-gold/80">
                  Locais
                </div>
                <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
                  {selectedEntries.map(({ key, entry, media }) => (
                    <li
                      key={key}
                      data-summary-item
                      data-point-name={entry.point.nome}
                      data-selected-media={media.join(",")}
                      className="flex items-start gap-2 text-sm text-white/85"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal" />
                      <div className="min-w-0">
                        <div>{entry.point.nome}</div>
                        <div className="mt-1">
                          <MediaTypeChips types={media} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {ledIntel.length > 0 && (
              <div className="mt-12" data-led-intelligence>
                <div className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-gold">
                  Painel LED — inteligência de audiência
                </div>
                <p className="mb-6 max-w-2xl text-sm leading-relaxed text-white/55">
                  O público que sua campanha pode alcançar em cada Painel LED selecionado e a
                  dimensão aproximada da campanha conforme a duração e as inserções escolhidas.
                </p>
                <div className="grid gap-5 lg:grid-cols-2">
                  {ledIntel.map((x) => (
                    <PointAudiencePanel
                      key={x.slug}
                      intelligence={x.intelligence}
                      pointName={x.name}
                    />
                  ))}
                </div>
                <div className="mt-6">
                  <CampaignAudienceSummary rollup={ledRollup} sim={sim} onSimChange={setSim} />
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <a
                href={buildProposalUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackFunnel("planner_submit", { planningIntent: midia ?? undefined })
                }
                className="btn-primary inline-flex items-center justify-center px-8 py-4 text-base"
              >
                Solicitar proposta
              </a>
              <button
                type="button"
                onClick={goBack}
                className="cursor-pointer font-semibold text-off-white/60 transition-colors hover:text-white"
              >
                Voltar
              </button>
            </div>
          </StepShell>
        )}
      </div>

      {step < 2 && (
        <BottomNav
          onBack={goBack}
          onNext={goNext}
          nextLabel={step === 1 ? "Ver resumo" : "Continuar"}
          nextDisabled={!canNext}
          showBack={step > 0}
        />
      )}

      {mediaPicker && (
        <PlannerMediaPicker
          open
          pointName={mediaPicker.entry.point.nome}
          categoryLabel={mediaPicker.entry.categoryLabel}
          available={mediaPicker.available}
          initialSelected={mediaPicker.initial}
          confirmLabel={mediaPicker.mode === "edit" ? "Salvar mídia" : "Adicionar ao planejador"}
          onConfirm={commitMediaPicker}
          onCancel={() => setMediaPicker(null)}
        />
      )}
    </section>
  );
}
