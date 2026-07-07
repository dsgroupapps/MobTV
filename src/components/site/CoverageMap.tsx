import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Wifi,
  Monitor,
  HeartPulse,
  Train,
  Bus,
  Store,
  Utensils,
  Building2,
  FlaskConical,
  BookOpen,
} from "lucide-react";

type IconKey =
  | "wifiDooh"
  | "wifi"
  | "saude"
  | "metro"
  | "onibus"
  | "feiras"
  | "restaurante"
  | "naHora"
  | "sesiLab"
  | "biblioteca";

// Connectivity variant drives the site-wide DOOH/WiFi color code:
// dourado = DOOH (telas/painéis), teal = WiFi, dual = ambos. Facility-type
// icons (metro, saúde etc.) that aren't a connectivity claim stay neutral.
type Variant = "dooh" | "wifi" | "dual" | "neutral";

const iconMeta: Record<IconKey, { icon: LucideIcon; label: string; variant: Variant }> = {
  wifiDooh: { icon: Monitor, label: "WiFi + DOOH", variant: "dual" },
  wifi: { icon: Wifi, label: "WiFi", variant: "wifi" },
  saude: { icon: HeartPulse, label: "Saúde", variant: "neutral" },
  metro: { icon: Train, label: "Metrô", variant: "neutral" },
  onibus: { icon: Bus, label: "Ônibus/BRT", variant: "neutral" },
  feiras: { icon: Store, label: "Feiras", variant: "neutral" },
  restaurante: { icon: Utensils, label: "Restaurante Comunitário", variant: "neutral" },
  naHora: { icon: Building2, label: "Na Hora", variant: "neutral" },
  sesiLab: { icon: FlaskConical, label: "SESI LAB", variant: "neutral" },
  biblioteca: { icon: BookOpen, label: "Bibliotecas", variant: "neutral" },
};

const badgeVariantClasses: Record<Variant, string> = {
  dooh: "bg-gold/15 text-gold",
  wifi: "bg-teal/15 text-teal",
  dual: "text-navy [background:linear-gradient(135deg,var(--gold)_50%,var(--teal)_50%)]",
  neutral: "bg-white/10 text-white/80",
};

const legendOrder: IconKey[] = [
  "wifiDooh",
  "wifi",
  "saude",
  "metro",
  "onibus",
  "feiras",
  "restaurante",
  "naHora",
  "sesiLab",
  "biblioteca",
];

type CityPoint = {
  name: string;
  x: number;
  y: number;
  count: number;
  icons: IconKey[];
};

// Coordinates derived from real DF/RA centroids, projected onto the VB_W x VB_H
// viewBox with the same equirectangular transform used for DF_OUTLINE.
const cities: CityPoint[] = [
  { name: "Ceilândia", x: 99.3, y: 167.1, count: 13, icons: ["wifi", "metro", "saude", "restaurante", "naHora", "onibus", "biblioteca"] },
  { name: "Gama", x: 117.3, y: 262.1, count: 6, icons: ["wifi", "saude", "onibus", "restaurante", "naHora"] },
  { name: "Sobradinho", x: 245.7, y: 87.5, count: 5, icons: ["wifi", "saude", "onibus", "restaurante", "naHora"] },
  { name: "Plano Piloto", x: 196.7, y: 155.9, count: 5, icons: ["wifi", "metro", "onibus", "naHora", "sesiLab"] },
  { name: "Brazlândia", x: 58.3, y: 102.2, count: 3, icons: ["wifiDooh", "saude", "restaurante", "naHora"] },
  { name: "Taguatinga", x: 131, y: 187, count: 3, icons: ["wifi", "saude", "naHora"] },
  { name: "Guará", x: 157.8, y: 170.1, count: 3, icons: ["wifi", "metro", "onibus"] },
  { name: "São Sebastião", x: 251.6, y: 208.0, count: 3, icons: ["wifi", "saude", "restaurante"] },
  { name: "Sobradinho II", x: 226.8, y: 84.5, count: 2, icons: ["saude"] },
  { name: "Samambaia", x: 106.9, y: 195.5, count: 2, icons: ["wifi", "saude"] },
  { name: "Recanto das Emas", x: 119.4, y: 207.6, count: 2, icons: ["wifi", "saude", "restaurante"] },
  { name: "Santa Maria", x: 149, y: 268, count: 2, icons: ["wifi", "saude", "onibus"] },
  { name: "Vicente Pires", x: 140.0, y: 165.3, count: 1, icons: ["wifi", "saude"] },
  { name: "Riacho Fundo II", x: 148, y: 232, count: 1, icons: ["wifi", "saude"] },
  { name: "Planaltina", x: 304.8, y: 72.4, count: 1, icons: ["wifi", "saude"] },
  { name: "Núcleo Bandeirante", x: 161.8, y: 192.7, count: 1, icons: ["wifi", "saude"] },
];

// Simplified real DF boundary (IBGE geodata), projected onto a 480x294 viewBox.
const DF_OUTLINE =
  "M 415.4,38.8 L 433.8,52.9 L 460.5,60.8 L 452.6,77.7 L 453.3,102.3 L 462.1,108.9 L 461.6,132.6 L 437.6,172.0 L 431.4,197.5 L 440.4,218.0 L 434.6,223.6 L 433.0,247.4 L 436.3,254.7 L 463.6,270.9 L 463.7,277.8 L 19.6,278.3 L 32.5,228.3 L 28.6,220.3 L 20.7,220.7 L 22.8,197.5 L 16.3,176.1 L 24.8,161.9 L 36.6,158.0 L 52.7,133.0 L 52.4,119.8 L 37.2,114.4 L 36.3,105.9 L 40.8,82.1 L 47.2,74.3 L 55.7,73.9 L 55.6,16.0 L 414.0,16.1 L 415.4,38.8 Z";
const VB_W = 480;
const VB_H = 294;

type CoverageMapProps = {
  onCitySelect?: (cityName: string) => void;
};

export function CoverageMap({ onCitySelect }: CoverageMapProps) {
  const [openCity, setOpenCity] = useState<string | null>(null);

  return (
    <div>
      <div className="relative mx-auto w-full max-w-2xl" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <path
            d={DF_OUTLINE}
            fill="color-mix(in oklab, var(--navy-soft) 55%, transparent)"
            stroke="var(--gold)"
            strokeOpacity={0.55}
            strokeWidth={1.5}
          />
        </svg>

        {cities.map((city, i) => {
          const isOpen = openCity === city.name;
          const xPct = (city.x / VB_W) * 100;
          const align = xPct < 20 ? "left" : xPct > 80 ? "right" : "center";
          const showAbove = city.y > VB_H * 0.62;

          return (
            <button
              key={city.name}
              type="button"
              onMouseEnter={() => setOpenCity(city.name)}
              onMouseLeave={() => setOpenCity((c) => (c === city.name ? null : c))}
              onFocus={() => setOpenCity(city.name)}
              onBlur={() => setOpenCity((c) => (c === city.name ? null : c))}
              onClick={() => {
                setOpenCity(city.name);
                onCitySelect?.(city.name);
              }}
              className="pin-pop absolute z-10 outline-none"
              style={{
                left: `${xPct}%`,
                top: `${(city.y / VB_H) * 100}%`,
                animationDelay: `${i * 60}ms`,
              }}
              aria-label={`${city.name}: ${city.count} ponto${city.count > 1 ? "s" : ""}`}
            >
              <span className="pin-halo pointer-events-none absolute inset-0 rounded-full bg-gold/50" />
              <span
                className={`relative flex items-center justify-center rounded-full border-2 border-navy bg-gold font-mono font-bold text-navy shadow-[0_2px_10px_-2px_rgba(0,0,0,0.5)] transition-all duration-200 ${
                  isOpen ? "h-7 w-7 text-[11px] sm:h-9 sm:w-9 sm:text-sm" : "h-5 w-5 text-[9px] sm:h-7 sm:w-7 sm:text-xs"
                }`}
              >
                {city.count}
              </span>

              {/* Tooltip */}
              <div
                className={`pointer-events-none absolute z-20 w-44 rounded-xl border border-white/10 bg-[color-mix(in_oklab,var(--navy)_94%,transparent)] p-3 text-left shadow-[0_12px_30px_-8px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all duration-200 ${
                  isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                } ${showAbove ? "bottom-full mb-3" : "top-full mt-3"} ${
                  align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
                }`}
              >
                <div className="font-display text-sm font-semibold text-white">{city.name}</div>
                <div className="mt-0.5 font-mono text-xs text-gold">
                  {city.count} ponto{city.count > 1 ? "s" : ""}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {city.icons.map((k) => {
                    const meta = iconMeta[k];
                    return (
                      <span
                        key={k}
                        title={meta.label}
                        className={`inline-flex h-5 w-5 items-center justify-center rounded ${badgeVariantClasses[meta.variant]}`}
                      >
                        <meta.icon className="h-3 w-3" strokeWidth={2} />
                      </span>
                    );
                  })}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {legendOrder.map((k) => {
          const meta = iconMeta[k];
          return (
            <div key={k} className="flex items-center gap-1.5 text-white/80">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded ${badgeVariantClasses[meta.variant]}`}>
                <meta.icon className="h-3 w-3" strokeWidth={2} />
              </span>
              <span className="font-mono text-xs tracking-wide">{meta.label}</span>
            </div>
          );
        })}
      </div>

      {/* Summary panel */}
      <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-gold/25 bg-[color-mix(in_oklab,var(--gold)_8%,transparent)] p-6 sm:flex-row sm:justify-center sm:gap-10 sm:p-7">
        <div className="text-center">
          <div className="font-display text-2xl font-bold text-gold sm:text-3xl">16</div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
            das Principais Cidades do DF
          </div>
        </div>
        <span className="hidden h-10 w-px bg-white/15 sm:block" />
        <div className="text-center">
          <div className="font-display text-2xl font-bold text-gold sm:text-3xl">53</div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">Pontos</div>
        </div>
        <span className="hidden h-10 w-px bg-white/15 sm:block" />
        <div className="text-center">
          <div className="font-display text-2xl font-bold text-gold sm:text-3xl">+15 milhões</div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
            de impactos por mês
          </div>
        </div>
      </div>
    </div>
  );
}
