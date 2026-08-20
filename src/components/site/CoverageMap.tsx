import { useId, useLayoutEffect, useRef, useState } from "react";
import {
  networkPoints,
  pointMediaTypes,
  totalPointsCount,
  type MediaTypeKey,
} from "@/data/network-points";
import { regionSummaries, activeRegionCount, PROJECTION_VIEWBOX } from "@/data/df-regions";
import { categoryIcon, MediaTypeChips } from "./MediaBadges";

// Contorno real do DF (dados IBGE), no mesmo canvas 2000x2100 usado para
// calibrar a projeção lat/lng → x/y das regiões (ver df-regions.ts) — dado
// geográfico fixo, não comercial, não precisa ser "derivado do dataset".
const DF_OUTLINE =
  "M 1352.7,732.1 L 1389.6,760.5 L 1443.3,776.3 L 1427.4,810.4 L 1428.8,859.8 L 1446.5,873.1 L 1445.5,920.8 L 1397.3,1000.1 L 1384.8,1051.4 L 1402.9,1092.6 L 1391.2,1103.8 L 1388.0,1151.7 L 1394.6,1166.4 L 1449.6,1198.9 L 1449.8,1212.8 L 556.6,1213.8 L 582.5,1113.2 L 574.7,1097.1 L 558.9,1098.0 L 563.0,1051.4 L 549.9,1008.2 L 567.0,979.7 L 590.8,971.9 L 623.2,921.6 L 622.6,895.0 L 592.0,884.2 L 590.2,867.1 L 599.2,819.2 L 612.2,803.5 L 629.2,802.7 L 629.0,686.3 L 1349.8,686.4 L 1352.7,732.1 Z";

const { width: VB_W, height: VB_H } = PROJECTION_VIEWBOX;
const maxCount = Math.max(...regionSummaries.map((r) => r.count));
const DF_BOUNDS = {
  minX: 549.9,
  minY: 686.3,
  width: 899.9,
  height: 527.5,
};
const DF_FRAME = {
  x: 90,
  y: 115,
  width: 1820,
  height: 1860,
};
const dfMapTransform = `translate(${DF_FRAME.x} ${DF_FRAME.y}) scale(${DF_FRAME.width / DF_BOUNDS.width} ${DF_FRAME.height / DF_BOUNDS.height}) translate(${-DF_BOUNDS.minX} ${-DF_BOUNDS.minY})`;
const bounds = regionSummaries.reduce(
  (acc, region) => ({
    minX: Math.min(acc.minX, region.x),
    maxX: Math.max(acc.maxX, region.x),
    minY: Math.min(acc.minY, region.y),
    maxY: Math.max(acc.maxY, region.y),
  }),
  { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
);
const mediaTypeOrder: MediaTypeKey[] = ["screen", "led", "wifi"];
const availableMediaTypes = mediaTypeOrder.filter((type) =>
  networkPoints.some((category) =>
    category.points.some((point) => pointMediaTypes(point).includes(type)),
  ),
);
type LabelPlacement = {
  label: string;
};

const regionLabelPlacement: Record<string, LabelPlacement> = {
  Brazlândia: {
    label: "bottom-full left-1/2 mb-2 -translate-x-1/2 text-center",
  },
  "Vicente Pires": {
    label: "left-full top-1/2 ml-2 -translate-y-1/2 text-left",
  },
  "Águas Claras": {
    label: "left-full top-1/2 ml-2 -translate-y-1/2 text-left",
  },
  "Recanto das Emas": {
    label: "right-full top-1/2 mr-2 -translate-y-1/2 text-right",
  },
  Guará: {
    label: "right-full top-1/2 mr-2 -translate-y-1/2 text-right",
  },
  "Riacho Fundo II": {
    label: "left-full top-1/2 ml-2 -translate-y-1/2 text-left",
  },
  "Santa Maria": {
    label: "left-full top-1/2 ml-2 -translate-y-1/2 text-left",
  },
  Samambaia: {
    label: "bottom-full left-1/2 mb-2 -translate-x-1/2 text-center",
  },
  "Plano Piloto": {
    label: "right-full top-1/2 mr-2 -translate-y-1/2 text-right",
  },
  Sobradinho: {
    label: "right-full top-1/2 mr-2 -translate-y-1/2 text-right",
  },
  "Sobradinho II": {
    label: "right-full top-1/2 mr-2 -translate-y-1/2 text-right",
  },
};

function toPercent(value: number, min: number, max: number, inset: number) {
  if (max === min) return 50;
  return inset + ((value - min) / (max - min)) * (100 - inset * 2);
}

function displayPosition(x: number, y: number) {
  return {
    left: toPercent(x, bounds.minX, bounds.maxX, 8),
    top: toPercent(y, bounds.minY, bounds.maxY, 10),
  };
}

function labelPlacement(region: string, left: number, top: number) {
  const custom = regionLabelPlacement[region];
  if (custom) return custom;
  if (left > 72) {
    return {
      label: "right-full top-1/2 mr-2 -translate-y-1/2 text-right",
    };
  }
  if (left < 26) {
    return {
      label: "left-full top-1/2 ml-2 -translate-y-1/2 text-left",
    };
  }
  if (top > 68) {
    return {
      label: "bottom-full left-1/2 mb-2 -translate-x-1/2 text-center",
    };
  }
  return {
    label: "left-full top-1/2 ml-2 -translate-y-1/2 text-left",
  };
}

type PopoverPlacement = {
  left: number;
  top: number;
};

const POPOVER = {
  width: 224,
  height: 118,
  gap: 12,
  padding: 8,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function computePopoverPlacement(
  map: HTMLDivElement,
  activeRegion: string,
  popover = POPOVER,
): PopoverPlacement | null {
  const mapRect = map.getBoundingClientRect();
  const pins = Array.from(map.querySelectorAll<HTMLElement>("[data-region-pin]"));
  const pin = pins.find((el) => el.dataset.regionPin === activeRegion);
  if (!pin) return null;

  const pinRect = pin.getBoundingClientRect();
  const anchorX = pinRect.left - mapRect.left + pinRect.width / 2;
  const anchorY = pinRect.top - mapRect.top + pinRect.height / 2;
  const pinRadius = Math.max(pinRect.width, pinRect.height) / 2;
  const maxLeft = Math.max(popover.padding, mapRect.width - popover.width - popover.padding);
  const maxTop = Math.max(popover.padding, mapRect.height - popover.height - popover.padding);
  const left = clamp(anchorX - popover.width / 2, popover.padding, maxLeft);
  const topAbove = anchorY - pinRadius - popover.gap - popover.height;
  const topBelow = anchorY + pinRadius + popover.gap;
  const top = topAbove >= popover.padding ? topAbove : clamp(topBelow, popover.padding, maxTop);

  return { left, top };
}

function mediaLabel(type: MediaTypeKey) {
  if (type === "screen") return "Telas";
  if (type === "led") return "Painéis LED";
  return "WiFi Ads";
}

function mediaDotClass(type: MediaTypeKey) {
  if (type === "screen") return "bg-gold";
  if (type === "led") return "bg-gold-deep ring-1 ring-gold";
  return "bg-teal";
}

function CompactMediaDots({ types }: { types: MediaTypeKey[] }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={types.map(mediaLabel).join(", ")}>
      {types.map((type) => (
        <span
          key={type}
          title={mediaLabel(type)}
          className={`h-2 w-2 rounded-full ${mediaDotClass(type)}`}
        />
      ))}
    </div>
  );
}

function RegionPin({
  region,
  count,
  x,
  y,
  active,
  onActivate,
  onClear,
  onSelect,
}: {
  region: string;
  count: number;
  x: number;
  y: number;
  active: boolean;
  onActivate: (region: string) => void;
  onClear: () => void;
  onSelect?: (region: string) => void;
}) {
  const size = 30 + (count / maxCount) * 23;
  const position = displayPosition(x, y);
  const placement = labelPlacement(region, position.left, position.top);

  return (
    <button
      type="button"
      data-coverage-region-button
      onClick={() => {
        onActivate(region);
        onSelect?.(region);
      }}
      onMouseEnter={() => onActivate(region)}
      onFocus={() => onActivate(region)}
      onBlur={onClear}
      aria-label={`${region}: ${count} ponto${count > 1 ? "s" : ""}`}
      className={`group absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer focus:outline-none ${active ? "z-20" : ""}`}
      style={{ left: `${position.left}%`, top: `${position.top}%` }}
    >
      <span
        data-region-pin={region}
        className="relative z-10 flex items-center justify-center rounded-full bg-gold font-mono font-bold text-navy ring-[3px] ring-navy shadow-[0_8px_20px_-10px_rgba(242,183,5,0.65)] transition-transform duration-200 group-hover:scale-110 group-focus-visible:scale-110"
        style={{ width: size, height: size, fontSize: size * 0.34 }}
      >
        {count}
        <span className="absolute inset-[-5px] rounded-full border border-gold/25" />
      </span>
      <span
        data-region-label={region}
        className={`pointer-events-none absolute z-20 max-w-20 rounded-[3px] bg-navy/40 px-1.5 py-0.5 font-mono text-[8px] font-medium uppercase leading-[1.05] tracking-[0.13em] text-off-white/72 ring-1 ring-white/5 backdrop-blur-[1px] ${placement.label}`}
      >
        {region}
      </span>
    </button>
  );
}

export function CoverageMap({ onRegionSelect }: { onRegionSelect?: (region: string) => void }) {
  const gradId = useId();
  const mapRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [popoverPlacement, setPopoverPlacement] = useState<PopoverPlacement | null>(null);
  const activeSummary = activeRegion
    ? regionSummaries.find((region) => region.region === activeRegion)
    : null;

  useLayoutEffect(() => {
    if (!activeRegion || !mapRef.current) {
      setPopoverPlacement(null);
      return;
    }

    const map = mapRef.current;
    let frame = 0;
    const updatePlacement = () => {
      const popover = popoverRef.current;
      setPopoverPlacement(
        computePopoverPlacement(map, activeRegion, {
          ...POPOVER,
          width: popover?.offsetWidth ?? POPOVER.width,
          height: popover?.offsetHeight ?? POPOVER.height,
        }),
      );
    };

    updatePlacement();
    frame = window.requestAnimationFrame(updatePlacement);
    const resizeObserver = new ResizeObserver(updatePlacement);
    resizeObserver.observe(map);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [activeRegion]);

  const cancelClose = () => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const activateRegion = (region: string) => {
    cancelClose();
    setActiveRegion(region);
  };

  const clearRegionSoon = () => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      setActiveRegion(null);
      closeTimerRef.current = null;
    }, 110);
  };

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(240px,1fr)] lg:items-stretch lg:gap-8">
      {/* Visualização — mapa com pins em telas largas; lista compacta por
          região em telas estreitas (não tenta encolher o mapa). */}
      <div className="min-w-0">
        <div
          ref={mapRef}
          data-coverage-map
          className="relative hidden min-h-[430px] w-full lg:block"
          aria-label="Distribuição da rede MOBTV por região do DF"
          onMouseLeave={clearRegionSoon}
          onPointerDown={(event) => {
            const target = event.target as HTMLElement;
            if (!target.closest("[data-coverage-region-button]")) {
              setActiveRegion(null);
            }
          }}
        >
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            style={{ overflow: "visible" }}
          >
            <defs>
              <radialGradient id={`${gradId}-glow`} cx="50%" cy="48%" r="72%">
                <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.06" />
                <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g transform={dfMapTransform}>
              <path d={DF_OUTLINE} fill={`url(#${gradId}-glow)`} />
              <path
                d={DF_OUTLINE}
                fill="color-mix(in oklab, var(--off-white) 8%, transparent)"
                stroke="var(--gold)"
                strokeOpacity="0.52"
                strokeWidth="2.25"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={DF_OUTLINE}
                fill="none"
                stroke="var(--teal)"
                strokeOpacity="0.16"
                strokeWidth="5"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </svg>
          {regionSummaries.map((r) => (
            <RegionPin
              key={r.region}
              region={r.region}
              count={r.count}
              x={r.x}
              y={r.y}
              active={activeRegion === r.region}
              onActivate={activateRegion}
              onClear={clearRegionSoon}
              onSelect={onRegionSelect}
            />
          ))}
          {activeSummary && popoverPlacement && (
            <div
              ref={popoverRef}
              role="tooltip"
              data-region-tooltip={activeSummary.region}
              className="animate-in fade-in zoom-in-95 pointer-events-none absolute z-50 rounded-xl bg-navy p-3.5 text-left shadow-[0_18px_42px_-24px_rgba(0,0,0,0.85)] ring-1 ring-white/15 duration-150"
              style={{
                left: popoverPlacement.left,
                top: popoverPlacement.top,
                width: POPOVER.width,
                minHeight: POPOVER.height,
              }}
            >
              <div className="font-display text-sm font-semibold text-white">
                {activeSummary.region}
              </div>
              <div className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-gold">
                {activeSummary.count} ponto{activeSummary.count > 1 ? "s" : ""}
              </div>
              <div className="mt-2.5">
                <MediaTypeChips types={activeSummary.mediaTypes} />
              </div>
            </div>
          )}
        </div>

        {/* Lista compacta — mobile/tablet */}
        <div className="grid grid-cols-2 gap-2 lg:hidden">
          {regionSummaries.map((r) => (
            <button
              key={r.region}
              type="button"
              onClick={() => onRegionSelect?.(r.region)}
              className="min-h-20 cursor-pointer rounded-xl bg-white/[0.03] p-3 text-left ring-1 ring-white/10 transition-colors hover:bg-white/[0.06]"
            >
              <div className="flex h-full flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 font-display text-sm font-semibold leading-tight text-white">
                    {r.region}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-gold">{r.count}</span>
                </div>
                <CompactMediaDots types={r.mediaTypes} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Resumo lateral — totais e categorias, ambos derivados do dataset. */}
      <aside className="flex flex-col justify-center rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/10 lg:p-7">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold/70">
          Cobertura MOBTV
        </div>
        <div className="mt-4 flex items-end gap-3">
          <div className="font-display text-6xl font-bold leading-none text-gold">
            {totalPointsCount}
          </div>
          <div className="pb-1.5 font-mono text-xs uppercase leading-tight tracking-[0.18em] text-off-white/65">
            Pontos
            <br />
            ativos
          </div>
        </div>

        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="font-display text-xl font-semibold text-white">
            {activeRegionCount} regiões do DF
          </div>
          <div className="mt-1 text-sm leading-relaxed text-off-white/55">
            Presença distribuída por transporte, saúde, feiras e atendimento público.
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-off-white/40">
            Categorias atuais
          </div>
          <ul className="grid grid-cols-1 gap-2.5">
            {networkPoints.map((cat) => {
              const Icon = categoryIcon[cat.key];
              return (
                <li key={cat.key} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5 text-sm text-off-white/75">
                    <Icon className="h-4 w-4 shrink-0 text-teal" strokeWidth={1.8} />
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <span className="font-mono text-xs text-gold/70">{cat.points.length}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(["screen", "led", "wifi"] as const).map((type) => (
            <span
              key={type}
              className="rounded-md bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-off-white/55 ring-1 ring-white/10"
            >
              {mediaLabel(type)}
            </span>
          ))}
        </div>
      </aside>

      <div className="lg:col-span-2">
        <div className="flex flex-col gap-4 border-t border-white/10 bg-navy/35 px-4 py-4 ring-1 ring-white/[0.04] sm:px-5 lg:min-h-[82px] lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
            <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-gold/70">
              Mídias
            </div>
            <MediaTypeChips types={availableMediaTypes} />
          </div>

          <div className="hidden h-8 w-px shrink-0 bg-white/10 lg:block" />

          <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4 lg:flex-1">
            <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-off-white/45">
              Onde estamos
            </div>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
              {networkPoints.map((cat) => {
                const Icon = categoryIcon[cat.key];
                return (
                  <span
                    key={cat.key}
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-off-white/62"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-teal" strokeWidth={1.8} />
                    {cat.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
