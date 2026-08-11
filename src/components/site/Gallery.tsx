import { useState, useMemo } from "react";
import { useReveal } from "@/hooks/useReveal";
import { Wifi, Monitor } from "lucide-react";
import transportesImg from "@/assets/network-transportes.jpg";
import saudeImg from "@/assets/network-saude.jpg";
import feirasImg from "@/assets/network-feiras.jpg";
import servicosImg from "@/assets/network-servicos.jpg";
import { networkPoints } from "@/data/network-points";

// Mesma fonte de fotos por ponto do Explorador de Ativos (network-points.ts)
// — evita duplicar o mapeamento de arquivos de public/. Alguns nomes aqui na
// Galeria usam redação um pouco diferente da do dataset; o alias cobre só
// essas divergências pontuais de texto, sem duplicar a lista inteira.
const nameAlias: Record<string, string> = {
  "Estação Central": "Estação Central (Plano Piloto)",
  "Feira Central da Ceilândia": "Feira da Ceilândia",
  "Shopping Popular de Ceilândia": "Shopping Popular Ceilândia",
  "Restaurante Comunitário de Brazlândia": "Brazlândia",
  "Restaurante Comunitário do Recanto": "Recanto",
  "Restaurante Comunitário do Gama": "Gama",
};

const pointImageByName = new Map<string, string>();
for (const cat of networkPoints) {
  for (const p of cat.points) {
    if (p.images?.[0]) pointImageByName.set(p.nome, p.images[0]);
  }
}

function resolveImage(name: string, fallback: string): string {
  const real = pointImageByName.get(name) ?? pointImageByName.get(nameAlias[name] ?? "");
  return real ?? fallback;
}

type CategoryKey = "metro" | "terminais" | "saude" | "feiras" | "restaurantes" | "servicos";

// dual = DOOH (telas/painéis) + WiFi; wifi = só rede WiFi Social (sem DOOH no Media Kit)
type Connectivity = "dual" | "wifi";

const categoryConnectivity: Record<CategoryKey, Connectivity> = {
  metro: "dual",
  terminais: "dual",
  saude: "dual",
  feiras: "dual",
  restaurantes: "wifi",
  servicos: "wifi",
};

type GalleryItem = {
  name: string;
  category: CategoryKey;
  categoryLabel: string;
  badge?: string;
  image: string;
};

const tabs: { key: CategoryKey | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "metro", label: "Estações de Metrô" },
  { key: "terminais", label: "Terminais Rodoviários" },
  { key: "saude", label: "Saúde" },
  { key: "feiras", label: "Feiras" },
  { key: "restaurantes", label: "Restaurantes Comunitários" },
  { key: "servicos", label: "Serviços" },
];

const categoryImages: Record<CategoryKey, string> = {
  metro: transportesImg,
  terminais: transportesImg,
  saude: saudeImg,
  feiras: feirasImg,
  restaurantes: servicosImg,
  servicos: servicosImg,
};

const rawItems: Omit<GalleryItem, "image">[] = [
  // Metro
  {
    name: "Estação Central",
    category: "metro",
    categoryLabel: "Estações de Metrô",
    badge: "1M+ impactos/mês",
  },
  {
    name: "Estação Shopping",
    category: "metro",
    categoryLabel: "Estações de Metrô",
    badge: "730 mil+ impactos/mês",
  },
  { name: "Estação Guará", category: "metro", categoryLabel: "Estações de Metrô" },
  {
    name: "Estação Praça do Relógio",
    category: "metro",
    categoryLabel: "Estações de Metrô",
    badge: "1M+ impactos/mês",
  },
  {
    name: "Estação Arniqueiras",
    category: "metro",
    categoryLabel: "Estações de Metrô",
    badge: "1,1M+ impactos/mês",
  },
  {
    name: "Estação Águas Claras",
    category: "metro",
    categoryLabel: "Estações de Metrô",
    badge: "1M+ impactos/mês",
  },
  { name: "Estação Ceilândia Centro", category: "metro", categoryLabel: "Estações de Metrô" },
  // Terminais
  {
    name: "Rodoviária do Plano Piloto",
    category: "terminais",
    categoryLabel: "Terminais Rodoviários",
  },
  {
    name: "Terminal Interestadual de Brasília",
    category: "terminais",
    categoryLabel: "Terminais Rodoviários",
  },
  {
    name: "Terminal BRT Santa Maria",
    category: "terminais",
    categoryLabel: "Terminais Rodoviários",
    badge: "3M+ impactos/mês",
  },
  {
    name: "Terminal BRT Gama",
    category: "terminais",
    categoryLabel: "Terminais Rodoviários",
    badge: "1,5M+ impactos/mês",
  },
  { name: 'Terminal Setor "O"', category: "terminais", categoryLabel: "Terminais Rodoviários" },
  // Saúde
  { name: "UPA Brazlândia", category: "saude", categoryLabel: "Saúde" },
  { name: "UPA Samambaia", category: "saude", categoryLabel: "Saúde" },
  { name: "UPA São Sebastião", category: "saude", categoryLabel: "Saúde" },
  { name: "Hospital Regional de Ceilândia", category: "saude", categoryLabel: "Saúde" },
  { name: "Hospital Regional de Taguatinga", category: "saude", categoryLabel: "Saúde" },
  { name: "Hospital Regional do Gama", category: "saude", categoryLabel: "Saúde" },
  // Feiras
  { name: "Feira do Guará", category: "feiras", categoryLabel: "Feiras" },
  { name: "Feira Central da Ceilândia", category: "feiras", categoryLabel: "Feiras" },
  { name: "Feira Azul do Gama", category: "feiras", categoryLabel: "Feiras" },
  { name: "Feira dos Goianos", category: "feiras", categoryLabel: "Feiras" },
  { name: "Shopping Popular de Ceilândia", category: "feiras", categoryLabel: "Feiras" },
  // Restaurantes
  {
    name: "Restaurante Comunitário de Brazlândia",
    category: "restaurantes",
    categoryLabel: "Restaurantes Comunitários",
  },
  {
    name: "Restaurante Comunitário do Recanto",
    category: "restaurantes",
    categoryLabel: "Restaurantes Comunitários",
  },
  {
    name: "Restaurante Comunitário do Gama",
    category: "restaurantes",
    categoryLabel: "Restaurantes Comunitários",
  },
  // Serviços
  { name: "Na Hora Ceilândia", category: "servicos", categoryLabel: "Serviços" },
  { name: "Na Hora Taguatinga", category: "servicos", categoryLabel: "Serviços" },
  { name: "Na Hora Rodoviária Plano Piloto", category: "servicos", categoryLabel: "Serviços" },
  { name: "SESI LAB", category: "servicos", categoryLabel: "Serviços" },
  { name: "Biblioteca da Ceilândia", category: "servicos", categoryLabel: "Serviços" },
];

const items: GalleryItem[] = rawItems.map((it) => ({
  ...it,
  image: resolveImage(it.name, categoryImages[it.category]),
}));

export function Gallery() {
  const [active, setActive] = useState<CategoryKey | "todos">("todos");
  const header = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const grid = useReveal<HTMLDivElement>({ threshold: 0.1 });

  const filtered = useMemo(
    () => (active === "todos" ? items : items.filter((i) => i.category === active)),
    [active],
  );

  return (
    <section id="galeria" className="bg-off-white text-ink py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div ref={header.ref} data-visible={header.visible} className="reveal-root max-w-3xl mb-14">
          <div className="reveal reveal-1 font-mono text-xs uppercase tracking-[0.3em] text-gold-deep mb-5">
            / GALERIA
          </div>
          <h2 className="reveal reveal-2 font-display font-bold text-ink text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
            Conheça nossos pontos
          </h2>
          <p className="reveal reveal-3 mt-5 text-ink-soft text-base md:text-lg leading-relaxed">
            Cobertura WiFi ADS e DOOH em 16 cidades do Distrito Federal — a maior rede da região.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 md:gap-3 mb-10">
          {tabs.map((t) => {
            const isActive = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-gold text-navy shadow-[0_6px_20px_-6px_rgba(242,183,5,0.5)]"
                    : "bg-navy/5 text-ink/70 ring-1 ring-ink/10 hover:bg-navy/10 hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div
          key={active}
          ref={grid.ref}
          data-visible={grid.visible}
          className="reveal-root grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6"
        >
          {filtered.map((item, i) => (
            <article
              key={item.name}
              className="gallery-card group relative overflow-hidden rounded-2xl shadow-[0_8px_28px_-12px_rgba(11,18,32,0.25)] h-[280px] sm:h-[300px] lg:h-[320px]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Background image */}
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                width={800}
                height={600}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/20"
              />

              {/* Category tag + DOOH/WiFi connectivity badge */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5">
                <span className="inline-block rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-white/90 ring-1 ring-white/20">
                  {item.categoryLabel}
                </span>
                {categoryConnectivity[item.category] === "dual" ? (
                  <span
                    title="WiFi + DOOH"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-navy ring-1 ring-white/20 [background:linear-gradient(135deg,var(--gold)_50%,var(--teal)_50%)]"
                  >
                    <Monitor className="h-3 w-3" strokeWidth={2} />
                  </span>
                ) : (
                  <span
                    title="WiFi"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal/80 text-navy ring-1 ring-white/20"
                  >
                    <Wifi className="h-3 w-3" strokeWidth={2} />
                  </span>
                )}
              </div>

              {/* Audit badge */}
              {item.badge && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-block rounded-md bg-gold px-2.5 py-1 text-[11px] font-mono font-medium text-navy shadow-md">
                    {item.badge}
                  </span>
                </div>
              )}

              {/* Bottom content */}
              <div className="relative z-10 flex h-full flex-col justify-end p-5">
                <h3 className="font-display font-semibold text-white text-lg leading-tight">
                  {item.name}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
