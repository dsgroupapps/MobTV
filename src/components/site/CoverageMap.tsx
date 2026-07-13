import { useId } from "react";
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
  Users,
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
// icons (metro, saúde etc.) that aren't a connectivity claim stay neutral (navy).
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

// Badge treatment for icons sitting on the WHITE info-cards (map pins).
const cardBadgeClasses: Record<Variant, string> = {
  dooh: "bg-gold text-navy",
  wifi: "bg-teal text-navy",
  dual: "text-navy [background:linear-gradient(135deg,var(--gold)_50%,var(--teal)_50%)]",
  neutral: "bg-navy text-off-white",
};

// Badge treatment for the bottom legend strip, sitting on the dark map background.
const legendBadgeClasses: Record<Variant, string> = {
  dooh: "bg-gold text-navy",
  wifi: "bg-teal text-navy",
  dual: "text-navy [background:linear-gradient(135deg,var(--gold)_50%,var(--teal)_50%)]",
  neutral: "bg-white/15 text-off-white",
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

// Real Media Kit copy — "Atuação Diversificada" (Monitores e Painéis LED, p.28/33).
const areasDeAtuacao = [
  "Estações Metrô",
  "Rodoviárias",
  "Hospitais",
  "Feiras",
  "BRTs",
  "UPAs",
  "Na Hora",
  "Restaurantes",
  "Bibliotecas",
];

type PinColor = "gold" | "goldDeep" | "teal" | "tealDeep" | "goldTeal" | "ink";

const pinColorStyles: Record<PinColor, { bg: string; text: string }> = {
  gold: { bg: "var(--gold)", text: "var(--navy)" },
  goldDeep: { bg: "var(--gold-deep)", text: "var(--navy)" },
  teal: { bg: "var(--teal)", text: "var(--navy)" },
  tealDeep: { bg: "color-mix(in oklab, var(--teal) 55%, var(--navy) 45%)", text: "var(--off-white)" },
  goldTeal: { bg: "color-mix(in oklab, var(--gold) 68%, var(--teal) 32%)", text: "var(--navy)" },
  ink: { bg: "var(--ink)", text: "var(--gold)" },
};

type Side = "left" | "right";

type CityPoint = {
  name: string;
  /** Anchor real (geográfico) — onde a haste toca o mapa. Não alterar. */
  x: number;
  y: number;
  /** Posição do balão (círculo + cartão) — leque com espaçamento generoso, sem sobreposição. */
  labelX: number;
  labelY: number;
  /** Lado para onde o cartão branco se estende a partir do círculo. */
  side: Side;
  color: PinColor;
  count: number;
  icons: IconKey[];
};

// Dados inalterados (cidades, contagens, categorias). x/y são o ponto real
// (geográfico, projetado) onde a haste toca o mapa — não alterar. labelX/labelY/side
// posicionam o balão ao redor do contorno do DF, seguindo a disposição da peça de
// referência original (não é grade): cada cidade fica no seu quadrante geográfico
// real, com o cartão crescendo para o lado que sobra mais espaço. As posições foram
// resolvidas por um checker de colisão par-a-par (footprint circle+card, pior caso de
// largura do mapa) para garantir zero sobreposição mesmo na tela mais estreita em que
// esta camada aparece (~740px de mapa, breakpoint xl com o painel lateral ao lado).
const cities: CityPoint[] = [
  { name: "Brazlândia", x: 634.4, y: 859.7, labelX: 250, labelY: 150, side: "right", color: "tealDeep", count: 3, icons: ["wifiDooh", "saude", "restaurante", "naHora"] },
  { name: "Sobradinho II", x: 973.3, y: 824.1, labelX: 780, labelY: 430, side: "left", color: "goldDeep", count: 2, icons: ["saude"] },
  { name: "Sobradinho", x: 1011.4, y: 830.1, labelX: 1220, labelY: 430, side: "right", color: "goldTeal", count: 5, icons: ["wifi", "saude", "onibus", "restaurante", "naHora"] },
  { name: "Planaltina", x: 1130.2, y: 799.7, labelX: 1700, labelY: 150, side: "left", color: "teal", count: 1, icons: ["wifi", "saude"] },

  { name: "Ceilândia", x: 716.9, y: 990.1, labelX: 640, labelY: 890, side: "left", color: "ink", count: 13, icons: ["wifi", "metro", "saude", "restaurante", "naHora", "onibus", "biblioteca"] },
  { name: "Vicente Pires", x: 798.7, y: 986.5, labelX: 640, labelY: 660, side: "left", color: "gold", count: 1, icons: ["wifi", "saude"] },
  { name: "Taguatinga", x: 780.6, y: 1030.2, labelX: 640, labelY: 1120, side: "left", color: "goldDeep", count: 3, icons: ["wifi", "saude", "naHora"] },
  { name: "Guará", x: 834.5, y: 996.2, labelX: 750, labelY: 900, side: "right", color: "teal", count: 3, icons: ["wifi", "metro", "onibus"] },
  { name: "Plano Piloto", x: 912.8, y: 967.6, labelX: 1050, labelY: 680, side: "right", color: "goldTeal", count: 5, icons: ["wifi", "metro", "onibus", "naHora", "sesiLab"] },

  { name: "Samambaia", x: 732.2, y: 1047.3, labelX: 640, labelY: 1350, side: "left", color: "goldTeal", count: 2, icons: ["wifi", "saude"] },
  { name: "Recanto das Emas", x: 757.3, y: 1071.6, labelX: 640, labelY: 1580, side: "left", color: "goldDeep", count: 2, icons: ["wifi", "saude", "restaurante"] },
  { name: "Núcleo Bandeirante", x: 842.6, y: 1041.7, labelX: 850, labelY: 1130, side: "right", color: "gold", count: 1, icons: ["wifi", "saude"] },

  { name: "Riacho Fundo II", x: 814.8, y: 1120.7, labelX: 640, labelY: 1810, side: "left", color: "tealDeep", count: 1, icons: ["wifi", "saude"] },
  { name: "São Sebastião", x: 1023.2, y: 1072.5, labelX: 1400, labelY: 1350, side: "right", color: "tealDeep", count: 3, icons: ["wifi", "saude", "restaurante"] },

  { name: "Gama", x: 753.1, y: 1181.2, labelX: 750, labelY: 1950, side: "right", color: "teal", count: 6, icons: ["wifi", "saude", "onibus", "restaurante", "naHora"] },
  { name: "Santa Maria", x: 816.8, y: 1193.1, labelX: 1150, labelY: 1720, side: "right", color: "goldTeal", count: 2, icons: ["wifi", "saude", "onibus"] },
];

// Contorno real do DF (dados IBGE), reprojetado num canvas 2000x2100 — a silhueta
// fica centralizada e relativamente compacta, deixando espaço ao redor para os
// balões seguirem a disposição geográfica real (não mais uma grade).
const DF_OUTLINE =
  "M 1352.7,732.1 L 1389.6,760.5 L 1443.3,776.3 L 1427.4,810.4 L 1428.8,859.8 L 1446.5,873.1 L 1445.5,920.8 L 1397.3,1000.1 L 1384.8,1051.4 L 1402.9,1092.6 L 1391.2,1103.8 L 1388.0,1151.7 L 1394.6,1166.4 L 1449.6,1198.9 L 1449.8,1212.8 L 556.6,1213.8 L 582.5,1113.2 L 574.7,1097.1 L 558.9,1098.0 L 563.0,1051.4 L 549.9,1008.2 L 567.0,979.7 L 590.8,971.9 L 623.2,921.6 L 622.6,895.0 L 592.0,884.2 L 590.2,867.1 L 599.2,819.2 L 612.2,803.5 L 629.2,802.7 L 629.0,686.3 L 1349.8,686.4 L 1352.7,732.1 Z";
const VB_W = 2000;
const VB_H = 2100;

type CoverageMapProps = {
  onCitySelect?: (cityName: string) => void;
};

function IconBadge({ k, classes, size = "h-6 w-6" }: { k: IconKey; classes: Record<Variant, string>; size?: string }) {
  const meta = iconMeta[k];
  return (
    <span
      title={meta.label}
      className={`inline-flex ${size} shrink-0 items-center justify-center rounded-full ring-2 ring-white/80 ${classes[meta.variant]}`}
    >
      <meta.icon className="h-3 w-3" strokeWidth={2.5} />
    </span>
  );
}

export function CoverageMap({ onCitySelect }: CoverageMapProps) {
  const gradId = useId();

  return (
    <div>
      {/* ===== Map + side panel ===== */}
      <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
        {/* ----- Map card ----- */}
        <div
          className="relative flex-1 rounded-[28px] border border-gold/20 bg-navy shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden"
          style={{ padding: "clamp(16px, 3vw, 40px)" }}
        >
          {/* ambient vignette for depth */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 15% 10%, color-mix(in oklab, var(--teal) 10%, transparent), transparent 55%), radial-gradient(120% 90% at 90% 100%, color-mix(in oklab, var(--gold) 12%, transparent), transparent 55%)",
            }}
          />

          <div className="relative w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
            <svg
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              className="absolute inset-0 h-full w-full overflow-visible"
              aria-hidden
            >
              <defs>
                <linearGradient id={`${gradId}-land`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--navy-soft)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--navy)" stopOpacity={0.88} />
                </linearGradient>
                <pattern id={`${gradId}-dots`} width="54" height="54" patternUnits="userSpaceOnUse">
                  <circle cx="4.6" cy="4.6" r="4.6" fill="var(--gold)" opacity="0.26" />
                </pattern>
                <clipPath id={`${gradId}-clip`}>
                  <path d={DF_OUTLINE} />
                </clipPath>
              </defs>

              {/* starfield texture behind everything */}
              {Array.from({ length: 1250 }).map((_, i) => {
                const sx = (i * 137.5) % VB_W;
                const sy = (i * 71.3) % VB_H;
                const r = (i % 3) * 0.85 + 1.15;
                return <circle key={i} cx={sx} cy={sy} r={r} fill="#ffffff" opacity={0.12} />;
              })}

              {/* DF landmass */}
              <path d={DF_OUTLINE} fill={`url(#${gradId}-land)`} stroke="var(--gold)" strokeOpacity={0.9} strokeWidth={9.5} />
              <rect
                x={0}
                y={0}
                width={VB_W}
                height={VB_H}
                fill={`url(#${gradId}-dots)`}
                clipPath={`url(#${gradId}-clip)`}
              />
              <path d={DF_OUTLINE} fill="none" stroke="var(--off-white)" strokeOpacity={0.22} strokeWidth={3.1} />

              {/* Stems: anchor real → posição do balão. Só faz sentido junto do balão
                  desktop (xl+) — abaixo disso o mini-mapa usa só os pontos compactos,
                  então a haste (que agora percorre boa distância até o card periférico)
                  fica escondida para não virar um emaranhado de linhas sem cartão. */}
              <g className="hidden xl:block">
                {cities.map((c) => {
                  const midX = (c.x + c.labelX) / 2;
                  const midY = (c.y + c.labelY) / 2;
                  const angle = (Math.atan2(c.labelY - c.y, c.labelX - c.x) * 180) / Math.PI;
                  const style = pinColorStyles[c.color];
                  return (
                    // pin-pop-scale (não pin-pop): o keyframe de pin-pop anima um translate(-50%,-50%)
                    // que, em SVG, resolve contra o viewport inteiro — desloca o <g> por metade do
                    // viewBox e desconecta a haste do ponto real. pin-pop-scale só anima escala/opacidade.
                    <g key={c.name} className="pin-pop-scale" style={{ animationDelay: "0ms" }}>
                      <line
                        x1={c.x}
                        y1={c.y}
                        x2={c.labelX}
                        y2={c.labelY}
                        stroke={style.bg}
                        strokeOpacity={0.6}
                        strokeWidth={4.6}
                        strokeDasharray="4.1 10"
                        strokeLinecap="round"
                      />
                      <circle cx={c.x} cy={c.y} r={10.9} fill={style.bg} stroke="var(--navy)" strokeWidth={3.4} />
                      <text
                        x={midX}
                        y={midY}
                        transform={`rotate(${angle}, ${midX}, ${midY})`}
                        textAnchor="middle"
                        dy={-8.4}
                        fontSize={25.9}
                        fontFamily="var(--font-mono)"
                        fill="var(--off-white)"
                        opacity={0.5}
                        style={{ paintOrder: "stroke", stroke: "var(--navy)", strokeWidth: 10 }}
                      >
                        {c.count} {c.count > 1 ? "pontos" : "ponto"}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* ===== Balloon pins (desktop grande — grade 3x6 verificada sem colisão) ===== */}
            <div className="hidden xl:block absolute inset-0">
              {cities.map((city, i) => {
                const xPct = (city.labelX / VB_W) * 100;
                const yPct = (city.labelY / VB_H) * 100;
                const side = city.side;
                const style = pinColorStyles[city.color];

                return (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => onCitySelect?.(city.name)}
                    className="absolute z-10 outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-2xl"
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      // Nota: o posicionamento (translate) fica só aqui, no botão — a
                      // classe de animação de entrada (pin-pop-scale) vai no filho
                      // abaixo, nunca neste elemento, porque uma animação de CSS rodando
                      // em "transform" sempre vence o valor inline dessa propriedade,
                      // o que apagaria este translate assim que a animação rodasse.
                      transform: side === "left" ? "translate(-100%, -50%)" : "translate(0, -50%)",
                    }}
                    aria-label={`${city.name}: ${city.count} ponto${city.count > 1 ? "s" : ""}`}
                  >
                    <div
                      className={`pin-pop-scale group flex items-center ${side === "left" ? "flex-row-reverse" : "flex-row"}`}
                      style={{
                        transformOrigin: side === "left" ? "100% 50%" : "0% 50%",
                        animationDelay: `${i * 70}ms`,
                      }}
                    >
                      {/* circle */}
                      <span className="relative shrink-0 z-10">
                        <span
                          className="pin-halo pointer-events-none absolute inset-0 rounded-full"
                          style={{ background: style.bg }}
                        />
                        <span
                          className="relative flex h-14 w-14 items-center justify-center rounded-full border-[3px] font-mono font-bold text-xl shadow-[0_8px_20px_-6px_rgba(0,0,0,0.55)] transition-transform duration-200 group-hover:scale-110"
                          style={{ background: style.bg, color: style.text, borderColor: "var(--navy)" }}
                        >
                          {city.count}
                        </span>
                      </span>

                      {/* card */}
                      <div
                        className={`relative z-[1] rounded-2xl bg-white shadow-[0_16px_36px_-12px_rgba(11,18,32,0.45)] py-2 w-[164px] transition-transform duration-200 group-hover:-translate-y-0.5 ${
                          side === "left" ? "-mr-4 pl-3 pr-5 text-right" : "-ml-4 pl-5 pr-3 text-left"
                        }`}
                      >
                        <div className="font-display font-bold text-ink text-[13px] leading-tight">
                          {city.name}
                        </div>
                        <div
                          className={`mt-1.5 flex flex-wrap gap-1 ${side === "left" ? "justify-end" : "justify-start"}`}
                        >
                          {city.icons.map((k) => (
                            <IconBadge key={k} k={k} classes={cardBadgeClasses} size="h-4 w-4" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ===== Compact pins (mobile + tablet, abaixo de xl) ===== */}
            <div className="xl:hidden absolute inset-0">
              {cities.map((city, i) => {
                const style = pinColorStyles[city.color];
                return (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => onCitySelect?.(city.name)}
                    className="pin-pop absolute z-10 flex items-center justify-center rounded-full border-2 font-mono font-bold text-[10px] shadow-md outline-none"
                    style={{
                      left: `${(city.x / VB_W) * 100}%`,
                      top: `${(city.y / VB_H) * 100}%`,
                      transform: "translate(-50%, -50%)",
                      width: 22,
                      height: 22,
                      background: style.bg,
                      color: style.text,
                      borderColor: "var(--navy)",
                      animationDelay: `${i * 45}ms`,
                    }}
                    aria-label={`${city.name}: ${city.count} ponto${city.count > 1 ? "s" : ""}`}
                  >
                    {city.count}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ----- Painel lateral (amarelo) ----- */}
        <div className="lg:w-[300px] shrink-0 rounded-[28px] bg-gold p-7 lg:p-8 shadow-[0_24px_60px_-18px_rgba(242,183,5,0.45)] flex flex-col">
          <div className="font-display font-bold text-navy text-2xl leading-tight">
            16 das Principais
            <br />
            Cidades do DF
          </div>
          <div className="mt-4 font-mono font-bold text-navy text-5xl leading-none">53</div>
          <div className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-navy/70">pontos</div>

          <div className="mt-6 h-px w-full bg-navy/15" />

          <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.15em] text-navy/70">
            Áreas de atuação
          </div>
          <ul className="mt-3 space-y-1.5">
            {areasDeAtuacao.map((area) => (
              <li key={area} className="flex items-center gap-2 text-navy font-medium text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-navy/60" />
                {area}
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-7">
            <div className="grid grid-cols-8 gap-1 opacity-80">
              {Array.from({ length: 16 }).map((_, i) => (
                <Users key={i} className="h-3.5 w-3.5 text-navy" strokeWidth={2} />
              ))}
            </div>
            <div className="mt-3 font-display font-bold text-navy text-2xl leading-tight">
              +15 milhões
            </div>
            <div className="font-mono text-xs uppercase tracking-[0.1em] text-navy/70">
              de impactos por mês
            </div>
          </div>
        </div>
      </div>

      {/* ----- City cards list (mobile + tablet, abaixo de xl) — 1 col no celular, 2 no tablet ----- */}
      <div className="xl:hidden mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cities.map((city) => {
          const style = pinColorStyles[city.color];
          return (
            <button
              key={city.name}
              type="button"
              onClick={() => onCitySelect?.(city.name)}
              className="w-full flex items-center gap-3 rounded-2xl bg-white shadow-sm p-3.5 text-left"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 font-mono font-bold text-base"
                style={{ background: style.bg, color: style.text, borderColor: "var(--navy)" }}
              >
                {city.count}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-ink text-sm">{city.name}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {city.icons.map((k) => (
                    <IconBadge key={k} k={k} classes={cardBadgeClasses} size="h-5 w-5" />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ===== Legend — infographic strip ===== */}
      <div className="mt-8 rounded-3xl bg-[color-mix(in_oklab,var(--navy-soft)_65%,transparent)] border border-white/10 px-5 py-6 md:px-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold/80 mb-4 text-center md:text-left">
          Legenda de cobertura
        </div>
        <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
          {legendOrder.map((k) => {
            const meta = iconMeta[k];
            return (
              <div
                key={k}
                className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 pl-1.5 pr-3.5 py-1.5"
              >
                <IconBadge k={k} classes={legendBadgeClasses} size="h-6 w-6" />
                <span className="font-mono text-xs tracking-wide text-off-white/85 whitespace-nowrap">
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
