import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Train,
  Bus,
  HeartPulse,
  Stethoscope,
  Store,
  Building2,
  X,
  ImageOff,
  Monitor,
  Grid3x3,
  Wifi,
  MapPin,
  ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";
import { CoverageMap } from "./CoverageMap";
import { Sheet, SheetContent, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  networkPoints,
  pointMediaTypes,
  totalPointsCount,
  type Category,
  type CategoryKey,
  type MediaTypeKey,
  type NetworkPoint,
  type PointLocation,
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
  servicos: Building2,
};

const tabs: { key: CategoryKey | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "metro", label: "Estações de Metrô" },
  { key: "terminais", label: "Terminais Rodoviários" },
  { key: "upas", label: "UPAs" },
  { key: "hospitais", label: "Hospitais" },
  { key: "feiras", label: "Feiras" },
  { key: "servicos", label: "Serviços" },
];

export const mediaTabs: { key: MediaTypeKey | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "screen", label: "Telas" },
  { key: "led", label: "Painéis de LED" },
  { key: "wifi", label: "WiFi Ads" },
];

// Identidade visual por tipo de mídia — reaproveitada pela Galeria e pelo
// Planejador de Campanha (não duplicar). TELA = preenchimento sólido gold;
// PAINEL LED = contorno gold-deep sobre fundo escuro (tratamento mais intenso,
// visualmente distinto do preenchimento sólido da Tela, mesma família de cor);
// WIFI ADS = preenchimento sólido teal.
const mediaTypeMeta: Record<
  MediaTypeKey,
  { label: string; Icon: LucideIcon; className: string }
> = {
  screen: {
    label: "Tela",
    Icon: Monitor,
    className: "bg-gold text-navy",
  },
  led: {
    label: "Painel LED",
    Icon: Grid3x3,
    className: "bg-navy/70 backdrop-blur-sm text-gold-deep ring-2 ring-gold-deep",
  },
  wifi: {
    label: "WiFi Ads",
    Icon: Wifi,
    className: "bg-teal text-navy",
  },
};

// Chips legíveis por tipo de mídia — usados no card, no painel de detalhe,
// na Galeria e no Planejador (não duplicar em outro arquivo).
export function MediaTypeChips({ types }: { types: MediaTypeKey[] }) {
  if (types.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {types.map((t) => {
        const meta = mediaTypeMeta[t];
        const Icon = meta.Icon;
        return (
          <span
            key={t}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${meta.className}`}
          >
            <Icon className="h-3 w-3" strokeWidth={2.4} />
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}

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
  const mediaTypes = pointMediaTypes(point);
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
        <MediaTypeChips types={mediaTypes} />
        {point.impactosAuditadosMes != null && (
          <div className="font-mono text-xs text-off-white/60">
            {formatNumber(point.impactosAuditadosMes)} impactos/mês
          </div>
        )}
        <div className="mt-auto flex items-center justify-end pt-1">
          {hasCommercialData(point) && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-off-white/40 group-hover:text-off-white/70 transition-colors">
              Ver detalhes →
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

// Preview de localização — substitui, no topo do drawer, o espaço que a foto
// ocupava antes (a foto foi para o painel grande ao lado). Sem API key do
// Google Maps no projeto: usa o embed "clássico" sem chave
// (google.com/maps?q=lat,lng&output=embed), que é a forma correta e estável
// de embutir um pino sem depender da Maps Embed API paga. `mapsUrl` é sempre
// o link de compartilhamento original fornecido pela MOBTV — nunca a URL
// longa resolvida — para o CTA "Ver no Google Maps".
function MapPreview({
  location,
  pointName,
}: {
  location: PointLocation | undefined;
  pointName: string;
}) {
  if (!location) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-5 text-sm text-off-white/45">
        <MapPin className="h-5 w-5 shrink-0 text-off-white/30" strokeWidth={1.6} />
        Localização no mapa em breve.
      </div>
    );
  }

  const embedSrc = `https://www.google.com/maps?q=${location.lat},${location.lng}&z=16&output=embed`;

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
      <div className="relative h-40 sm:h-44 w-full bg-white/5">
        <iframe
          src={embedSrc}
          title={`Mapa — ${pointName}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      <a
        href={location.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex cursor-pointer items-center justify-between gap-2 bg-white/[0.04] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-off-white/70 transition-colors hover:bg-white/[0.08] hover:text-gold"
      >
        Ver no Google Maps
        <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
      </a>
    </div>
  );
}

function PointDetail({ point, category }: { point: NetworkPoint; category: Category }) {
  const Icon = categoryIcon[category.key];
  const hasData = hasCommercialData(point);
  const mediaTypes = pointMediaTypes(point);

  return (
    <div className="flex h-full flex-col">
      {/* Viewer da foto — só existe dentro do drawer em mobile/tablet (< md).
          Em desktop a foto vira um elemento flutuante independente sobre o
          overlay da página (ver FloatingPointPhoto em AssetExplorer), então
          este bloco some a partir de md. Fundo escuro sólido (nunca a própria
          foto em full-bleed) com a fotografia centralizada e contida dentro
          dele — largura generosa mas nunca 100%, altura sempre limitada,
          nunca um crop vertical agressivo. */}
      <div
        className="relative md:hidden h-64 sm:h-80 shrink-0 overflow-hidden"
        style={{ background: "color-mix(in oklab, var(--navy) 88%, black)" }}
      >
        {point.images && point.images.length > 0 ? (
          <>
            {/* Vinheta muito sutil — só para dar profundidade ao fundo, não
                para ambientar com a própria foto. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(130% 100% at 50% 42%, transparent 35%, color-mix(in oklab, var(--navy) 40%, transparent) 100%)",
              }}
            />
            <div className="relative flex h-full w-full items-center justify-center p-6 sm:p-8">
              <img
                src={point.images[0]}
                alt={point.nome}
                className="w-auto h-auto max-w-[85%] rounded-[20px] object-contain shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/10"
                style={{ maxHeight: "min(68vh, 100%)" }}
              />
            </div>
          </>
        ) : (
          <PhotoFallback Icon={Icon} size="detail" />
        )}
      </div>

      {/* Coluna de informações — único conteúdo do drawer em desktop (a foto
          já não mora mais aqui). */}
      <div className="min-w-0 flex-1 flex flex-col overflow-y-auto p-6 sm:p-8">
        <MapPreview location={point.location} pointName={point.nome} />

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
          <div className="mt-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-off-white/45 mb-2.5">
              Mídia disponível
            </div>
            {mediaTypes.length > 0 ? (
              <MediaTypeChips types={mediaTypes} />
            ) : (
              <p className="text-sm text-off-white/50">
                Modalidade ainda não publicada individualmente no rate card.
              </p>
            )}
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
    </div>
  );
}

export function AssetExplorer() {
  const [active, setActive] = useState<CategoryKey | "todos">("todos");
  const [mediaFilter, setMediaFilter] = useState<MediaTypeKey | "todos">("todos");
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
        if (mediaFilter !== "todos" && !pointMediaTypes(point).includes(mediaFilter)) continue;
        out.push({ point, category: cat });
      }
    }
    return out;
  }, [active, cityFilter, mediaFilter]);

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
            {totalPointsCount} pontos. 16 cidades. Um só mapa.
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

          <div className="reveal reveal-3 mt-5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-off-white/40 mr-1">
              Tipo de mídia:
            </span>
            {mediaTabs.map((t) => {
              const isActive = mediaFilter === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setMediaFilter(t.key)}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-teal text-navy shadow-[0_6px_20px_-6px_rgba(45,212,191,0.5)]"
                      : "bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
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

      {/* Detail panel — bottom sheet no mobile (foto dentro do drawer), painel
          lateral compacto no desktop. Em desktop a foto NÃO mora no drawer:
          é um card flutuante independente, renderizado a seguir, sobre o
          overlay escuro da própria página. */}
      <Sheet open={openPoint != null} onOpenChange={(open) => !open && setOpenPoint(null)}>
        <SheetContent
          side="right"
          hideClose
          className="max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:h-auto max-sm:max-h-[90dvh] max-sm:w-full max-sm:rounded-t-3xl max-sm:border-t max-sm:border-l-0 max-sm:overflow-y-auto sm:w-[440px] sm:max-w-[440px] sm:overflow-y-auto bg-navy border-white/10 p-0"
        >
          <SheetClose className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-navy/70 text-off-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-navy hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold">
            <X className="h-5 w-5" strokeWidth={2} />
            <span className="sr-only">Fechar</span>
          </SheetClose>
          {openPoint && <PointDetail point={openPoint.point} category={openPoint.category} />}
        </SheetContent>
      </Sheet>

      {/* Foto flutuante — só em desktop (md+), fora do drawer. Ocupa o
          espaço entre a borda esquerda da viewport e o drawer, sobre o
          overlay escuro do próprio Sheet (que já escurece a página ao
          fundo). Não intercepta clique (pointer-events-none): o overlay
          continua respondendo normalmente por baixo dela. z acima do
          overlay/drawer (ambos z-50) para garantir que a foto apareça por
          cima do véu escuro, não escondida atrás dele. */}
      {openPoint && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-y-0 left-0 z-[60] hidden md:right-[440px] md:flex md:items-center md:justify-center md:px-10 lg:px-16"
        >
          {openPoint.point.images && openPoint.point.images.length > 0 ? (
            <img
              src={openPoint.point.images[0]}
              alt=""
              className="w-auto h-auto rounded-[18px] object-contain shadow-[0_30px_90px_-24px_rgba(0,0,0,0.75)] ring-1 ring-white/10"
              style={{ maxWidth: "min(78%, 900px)", maxHeight: "78vh" }}
            />
          ) : (
            <div
              className="w-full overflow-hidden rounded-[18px] shadow-[0_30px_90px_-24px_rgba(0,0,0,0.75)] ring-1 ring-white/10"
              style={{ maxWidth: "min(78%, 900px)", aspectRatio: "16 / 9" }}
            >
              <PhotoFallback Icon={categoryIcon[openPoint.category.key]} size="detail" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
