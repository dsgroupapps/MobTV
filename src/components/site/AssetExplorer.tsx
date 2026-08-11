import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Train,
  Bus,
  HeartPulse,
  Stethoscope,
  Store,
  Utensils,
  Building2,
  X,
  ImageOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";
import { CoverageMap } from "./CoverageMap";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  networkPoints,
  type Category,
  type CategoryKey,
  type NetworkPoint,
} from "@/data/network-points";

const WHATSAPP_NUMBER = "5561992590234";

// Exportado para reuso pelo Planejador de Campanha (mesmos ícones/fallback
// visual por categoria — não duplicar em outro arquivo).
export const categoryIcon: Record<CategoryKey, LucideIcon> = {
  metro: Train,
  terminais: Bus,
  upas: HeartPulse,
  hospitais: Stethoscope,
  feiras: Store,
  restaurantes: Utensils,
  servicos: Building2,
};

const tabs: { key: CategoryKey | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
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

// Heurística de correspondência ponto↔cidade por substring — mesma lógica
// usada pelo filtro de cidade do mapa executivo e reaproveitada pelo
// Planejador de Campanha na etapa de Região. É deliberadamente simples: só
// casa quando o nome da cidade aparece literalmente no nome do ponto (ou
// vice-versa), sem inferência geográfica.
export function isCityMatch(name: string, city: string) {
  return name.includes(city) || city.includes(name);
}

function buildInterestUrl(pointName: string) {
  const text = `Olá! Tenho interesse em anunciar no ponto "${pointName}" da rede MOBTV e gostaria de receber mais informações.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

// True quando o ponto tem QUALQUER dado comercial granular associado —
// controla se mostramos o indicador discreto no card e a seção de
// "informações comerciais" no detalhe.
export function hasCommercialData(point: NetworkPoint) {
  return Boolean(
    (point.produtos && point.produtos.length > 0) ||
    point.valorPorCpe ||
    point.fluxoMensal ||
    point.impactosAuditadosMes,
  );
}

export function ConnectivityDots({ connectivity }: { connectivity: Category["connectivity"] }) {
  return (
    <div className="flex items-center gap-2">
      {connectivity === "dual" && (
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-gold">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          DOOH
        </span>
      )}
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-teal">
        <span className="h-1.5 w-1.5 rounded-full bg-teal" />
        WiFi
      </span>
    </div>
  );
}

// Fallback visual quando o ponto ainda não tem fotografia própria — nunca
// reaproveita foto de outro local. Ícone da categoria sobre um gradiente
// navy/gold/teal com os arcos de sinal, coerente com a identidade MOBTV.
export function PhotoFallback({
  Icon,
  size = "card",
}: {
  Icon: LucideIcon;
  size?: "card" | "detail";
}) {
  const iconSize = size === "detail" ? "h-9 w-9" : "h-6 w-6";
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 140% at 15% 0%, color-mix(in oklab, var(--teal) 20%, var(--navy)), var(--navy) 60%)",
      }}
    >
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-50"
        style={{ overflow: "visible" }}
      >
        <circle
          cx="90%"
          cy="105%"
          r="70"
          fill="none"
          stroke="var(--gold)"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
        <circle
          cx="90%"
          cy="105%"
          r="120"
          fill="none"
          stroke="var(--teal)"
          strokeOpacity="0.22"
          strokeWidth="1.5"
        />
        <circle
          cx="90%"
          cy="105%"
          r="170"
          fill="none"
          stroke="var(--gold)"
          strokeOpacity="0.12"
          strokeWidth="1.5"
        />
      </svg>
      <span
        className={`relative flex ${size === "detail" ? "h-16 w-16" : "h-11 w-11"} items-center justify-center rounded-full bg-white/8 ring-1 ring-white/15 text-gold`}
      >
        <Icon className={iconSize} strokeWidth={1.6} />
      </span>
    </div>
  );
}

function AssetCard({
  point,
  category,
  onOpen,
  revealClass,
}: {
  point: NetworkPoint;
  category: Category;
  onOpen: () => void;
  revealClass: string;
}) {
  const Icon = categoryIcon[category.key];
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${revealClass} group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl text-left ring-1 ring-white/10 transition-all duration-300 hover:ring-white/25 bg-[color-mix(in_oklab,var(--navy-soft)_55%,transparent)]`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {point.images && point.images.length > 0 ? (
          <img
            src={point.images[0]}
            alt={point.nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="transition-transform duration-700 ease-out group-hover:scale-105 h-full w-full">
            <PhotoFallback Icon={Icon} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4 md:p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-off-white/45">
          {category.label}
        </div>
        <div className="font-display text-base md:text-lg font-semibold leading-snug text-white">
          {point.nome}
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          <ConnectivityDots connectivity={category.connectivity} />
          {hasCommercialData(point) && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-off-white/40 group-hover:text-off-white/70 transition-colors">
              ver dados →
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-white/8 last:border-b-0">
      <span className="text-sm text-off-white/60">{label}</span>
      <span className="font-mono text-sm text-gold text-right">{value}</span>
    </div>
  );
}

function PointDetail({ point, category }: { point: NetworkPoint; category: Category }) {
  const Icon = categoryIcon[category.key];
  const hasData = hasCommercialData(point);

  return (
    <div className="flex h-full flex-col">
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl">
        {point.images && point.images.length > 0 ? (
          <img src={point.images[0]} alt={point.nome} className="h-full w-full object-cover" />
        ) : (
          <PhotoFallback Icon={Icon} size="detail" />
        )}
      </div>

      <div className="mt-6">
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-gold-deep">
          {category.label}
        </div>
        <SheetTitle className="mt-2 font-display text-2xl md:text-3xl font-bold text-white leading-tight">
          {point.nome}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Detalhes comerciais do ponto {point.nome}, rede MOBTV.
        </SheetDescription>
        <div className="mt-4">
          <ConnectivityDots connectivity={category.connectivity} />
        </div>
      </div>

      <div className="mt-7">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-off-white/45 mb-2">
          Informações comerciais
        </div>
        {hasData ? (
          <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/8 px-4">
            {point.produtos?.map((p, i) => (
              <div key={i}>
                <DetailRow
                  label={`Formato (${p.tipo})`}
                  value={`${p.telas} tela${p.telas > 1 ? "s" : ""}`}
                />
                {p.custoInsercao15s != null && (
                  <DetailRow
                    label="Custo por inserção — 15s"
                    value={formatBRL(p.custoInsercao15s)}
                  />
                )}
                {p.custoInsercao30s != null && (
                  <DetailRow
                    label="Custo por inserção — 30s"
                    value={formatBRL(p.custoInsercao30s)}
                  />
                )}
              </div>
            ))}
            {point.valorPorCpe != null && (
              <DetailRow
                label="WiFi Ads — custo por engajamento (CPE)"
                value={formatBRL(point.valorPorCpe)}
              />
            )}
            {point.fluxoMensal != null && (
              <DetailRow
                label="Fluxo mensal de passageiros"
                value={`${formatNumber(point.fluxoMensal)}/mês`}
              />
            )}
            {point.impactosAuditadosMes != null && (
              <DetailRow
                label="Impactos auditados/mês (Datavisiooh, 2024)"
                value={formatNumber(point.impactosAuditadosMes)}
              />
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/8 px-4 py-4 text-sm text-off-white/55 leading-relaxed">
            Este ponto ainda não tem preço ou impacto individual publicado no rate card. Fale com
            nosso time comercial para uma proposta sob medida.
          </div>
        )}
      </div>

      <div className="mt-auto pt-8 flex flex-col gap-3">
        <Link
          to="/planejador"
          search={{ ponto: point.nome, categoria: category.key }}
          className="btn-primary w-full flex items-center justify-center gap-2 text-center"
        >
          Adicionar ao planejador →
        </Link>
        <a
          href={buildInterestUrl(point.nome)}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer w-full text-center font-mono text-xs uppercase tracking-wider text-off-white/55 hover:text-gold transition-colors py-2"
        >
          Ou fale sobre este ponto no WhatsApp
        </a>
      </div>
    </div>
  );
}

export function AssetExplorer() {
  const [active, setActive] = useState<CategoryKey | "todos">("todos");
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [openPoint, setOpenPoint] = useState<{ point: NetworkPoint; category: Category } | null>(
    null,
  );

  const header = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const mapReveal = useReveal<HTMLDivElement>({ threshold: 0.15 });
  const tabsReveal = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const gridReveal = useReveal<HTMLDivElement>({ threshold: 0.1 });

  const visiblePoints = useMemo(() => {
    const cats = active === "todos" ? networkPoints : networkPoints.filter((c) => c.key === active);
    const out: { point: NetworkPoint; category: Category }[] = [];
    for (const cat of cats) {
      for (const point of cat.points) {
        if (cityFilter && !isCityMatch(point.nome, cityFilter)) continue;
        out.push({ point, category: cat });
      }
    }
    return out;
  }, [active, cityFilter]);

  const handleCitySelect = (cityName: string) => {
    setActive("todos");
    setCityFilter(cityName);
    gridReveal.ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="pontos"
      className="relative bg-navy text-off-white py-24 md:py-32 px-6 overflow-hidden"
    >
      <svg aria-hidden className="absolute inset-0 h-full w-full opacity-40 pointer-events-none">
        <g fill="none" strokeWidth="1">
          <circle
            cx="95%"
            cy="-5%"
            r="220"
            stroke="#F2B705"
            strokeOpacity="0.18"
            strokeDasharray="380 900"
          />
          <circle
            cx="95%"
            cy="-5%"
            r="380"
            stroke="#2DD4BF"
            strokeOpacity="0.12"
            strokeDasharray="600 1400"
          />
          <circle
            cx="95%"
            cy="-5%"
            r="560"
            stroke="#F2B705"
            strokeOpacity="0.08"
            strokeDasharray="900 2000"
          />
        </g>
      </svg>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div ref={header.ref} data-visible={header.visible} className="reveal-root max-w-3xl">
          <div className="reveal reveal-1 font-mono text-xs uppercase tracking-[0.3em] text-gold mb-5">
            / VISÃO EXECUTIVA
          </div>
          <h2 className="reveal reveal-2 font-display font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
            53 pontos. 16 cidades. Um só mapa.
          </h2>
          <p className="reveal reveal-3 mt-5 text-white/70 text-base md:text-lg leading-relaxed">
            Cobertura por cidade, num único olhar. Clique numa cidade do mapa ou explore os ativos
            abaixo para entender onde sua campanha poderia estar.
          </p>
        </div>

        {/* Block 1 — Executive map */}
        <div
          ref={mapReveal.ref}
          data-visible={mapReveal.visible}
          className="reveal-root mt-14 md:mt-16"
        >
          <div className="reveal reveal-1 relative rounded-2xl border border-white/10 bg-[color-mix(in_oklab,var(--navy-soft)_60%,transparent)] p-6 md:p-10 backdrop-blur-sm">
            <CoverageMap onCitySelect={handleCitySelect} />
          </div>
        </div>

        {/* Block 2 — Explorer intro + tabs */}
        <div
          ref={tabsReveal.ref}
          data-visible={tabsReveal.visible}
          className="reveal-root mt-20 md:mt-24"
        >
          <div className="reveal reveal-1 max-w-3xl">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-teal mb-4">
              / EXPLORADOR DE ATIVOS
            </div>
            <h3 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight tracking-tight">
              Onde sua marca poderia estar
            </h3>
          </div>

          <div className="reveal reveal-2 mt-8 flex flex-wrap gap-2 md:gap-3">
            {tabs.map((t) => {
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setActive(t.key);
                    setCityFilter(null);
                  }}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gold text-navy shadow-[0_6px_20px_-6px_rgba(242,183,5,0.5)]"
                      : "bg-white/5 text-white/75 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {cityFilter && (
            <div className="reveal reveal-3 mt-4">
              <button
                onClick={() => setCityFilter(null)}
                className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-gold/15 ring-1 ring-gold/40 pl-4 pr-2.5 py-1.5 text-sm text-gold"
              >
                Cidade: {cityFilter}
                <X className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
            </div>
          )}
        </div>

        {/* Block 3 — Grid */}
        <div ref={gridReveal.ref} data-visible={gridReveal.visible} className="reveal-root mt-10">
          {visiblePoints.length > 0 ? (
            <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visiblePoints.map(({ point, category }, i) => (
                <AssetCard
                  key={`${category.key}-${point.nome}`}
                  point={point}
                  category={category}
                  revealClass={`reveal reveal-${(i % 5) + 1}`}
                  onOpen={() => setOpenPoint({ point, category })}
                />
              ))}
            </div>
          ) : (
            <div className="reveal reveal-1 rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/60">
              <ImageOff className="mx-auto h-6 w-6 mb-3 opacity-50" strokeWidth={1.6} />
              Nenhum ponto encontrado com esse filtro.
            </div>
          )}
        </div>

        {/* CTA de fechamento — para quem já explorou o suficiente sem abrir um ponto específico */}
        {visiblePoints.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/25 bg-gold/5 px-6 py-5">
            <p className="text-sm text-white/75">
              Já sabe quais pontos fazem sentido para sua marca?
            </p>
            <Link to="/planejador" className="btn-primary shrink-0">
              Monte sua campanha →
            </Link>
          </div>
        )}
      </div>

      {/* Detail panel — bottom sheet no mobile, painel lateral no desktop */}
      <Sheet open={openPoint != null} onOpenChange={(open) => !open && setOpenPoint(null)}>
        <SheetContent
          side="right"
          className="max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:h-auto max-sm:max-h-[88dvh] max-sm:w-full max-sm:rounded-t-3xl max-sm:border-t max-sm:border-l-0 max-sm:overflow-y-auto sm:w-[440px] sm:max-w-[440px] sm:overflow-y-auto bg-navy border-white/10 p-6 sm:p-8"
        >
          {openPoint && <PointDetail point={openPoint.point} category={openPoint.category} />}
        </SheetContent>
      </Sheet>
    </section>
  );
}
