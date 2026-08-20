import { Train, Bus, HeartPulse, Stethoscope, Store, Building2, Monitor, Grid3x3, Wifi } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CategoryKey, MediaTypeKey } from "@/data/network-points";

/**
 * Identidade visual por categoria e por tipo de mídia — extraída de
 * AssetExplorer.tsx para ser importável tanto por AssetExplorer quanto por
 * CoverageMap sem criar import circular entre os dois (CoverageMap é
 * renderizado de dentro de AssetExplorer). Única fonte para essas cores em
 * todo o site — não duplicar em outro arquivo.
 */
export const categoryIcon: Record<CategoryKey, LucideIcon> = {
  metro: Train,
  terminais: Bus,
  upas: HeartPulse,
  hospitais: Stethoscope,
  feiras: Store,
  servicos: Building2,
};

// TELA = preenchimento sólido gold; PAINEL LED = contorno gold-deep sobre
// fundo escuro (tratamento mais intenso, visualmente distinto do
// preenchimento sólido da Tela, mesma família de cor); WIFI ADS =
// preenchimento sólido teal.
export const mediaTypeMeta: Record<
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

/** Chips de mídia — usados no card, no painel de detalhe, na Galeria, no Planejador e na Cobertura. */
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
