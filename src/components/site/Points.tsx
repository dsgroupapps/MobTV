import { useMemo, useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import { MapPin, Train, Bus, HeartPulse, Stethoscope, Store, Utensils, Building2 } from "lucide-react";
import { CoverageMap } from "./CoverageMap";

type CategoryKey =
  | "metro"
  | "terminais"
  | "upas"
  | "hospitais"
  | "feiras"
  | "restaurantes"
  | "servicos";

// dual = DOOH (telas/painéis) + WiFi; wifi = só rede WiFi Social (sem DOOH no Media Kit)
type Connectivity = "dual" | "wifi";

type Category = {
  key: CategoryKey;
  label: string;
  icon: typeof MapPin;
  items: string[];
  dotColor: "gold" | "teal" | "white" | "red";
  connectivity: Connectivity;
};

const connectivityBadgeClasses: Record<Connectivity, string> = {
  dual: "text-navy [background:linear-gradient(135deg,var(--gold)_50%,var(--teal)_50%)]",
  wifi: "bg-teal/15 text-teal",
};

const categories: Category[] = [
  {
    key: "metro",
    label: "Estações de Metrô",
    icon: Train,
    dotColor: "gold",
    connectivity: "dual",
    items: [
      "Estação Central (Plano Piloto)",
      "Estação Shopping",
      "Estação Feira",
      "Estação Guará",
      "Estação Ceilândia Centro",
      "Estação Ceilândia Sul",
      "Estação Ceilândia Norte",
      "Estação Guariroba",
      "Estação Águas Claras",
      "Estação Arniqueiras",
      "Estação Praça do Relógio",
    ],
  },
  {
    key: "terminais",
    label: "Terminais Rodoviários",
    icon: Bus,
    dotColor: "gold",
    connectivity: "dual",
    items: [
      "Rodoviária do Plano Piloto",
      "Rodoviária de Sobradinho",
      "Terminal BRT Santa Maria",
      "Terminal BRT Gama",
      "Terminal Setor \"O\"",
      "Terminal Interestadual de Brasília",
    ],
  },
  {
    key: "upas",
    label: "UPAs",
    icon: HeartPulse,
    dotColor: "white",
    connectivity: "dual",
    items: [
      "UPA Ceilândia",
      "UPA Samambaia",
      "UPA São Sebastião",
      "UPA Sobradinho II",
      "UPA Gama",
      "UPA Recanto das Emas",
      "UPA Riacho Fundo II",
      "UPA Planaltina",
      "UPA Vicente Pires",
      "UPA Brazlândia",
      "UPA Ceilândia Setor O",
    ],
  },
  {
    key: "hospitais",
    label: "Hospitais",
    icon: Stethoscope,
    dotColor: "white",
    connectivity: "dual",
    items: [
      "Hospital Regional de Taguatinga",
      "Hospital Regional de Ceilândia",
      "Hospital Regional do Gama",
      "Hospital Regional de Sobradinho",
      "Hospital Regional de Santa Maria",
    ],
  },
  {
    key: "feiras",
    label: "Feiras",
    icon: Store,
    dotColor: "red",
    connectivity: "dual",
    items: [
      "Feira do Guará",
      "Feira dos Goianos",
      "Feira Azul do Gama",
      "Feira Modelo de Sobradinho I",
      "Feira da Ceilândia",
      "Shopping Popular Ceilândia",
      "Feira de Samambaia",
    ],
  },
  {
    key: "restaurantes",
    label: "Restaurantes Comunitários",
    icon: Utensils,
    dotColor: "red",
    connectivity: "wifi",
    items: [
      "Brazlândia",
      "Sobradinho II",
      "Ceilândia",
      "São Sebastião",
      "Gama",
      "Recanto",
    ],
  },
  {
    key: "servicos",
    label: "Serviços",
    icon: Building2,
    dotColor: "teal",
    connectivity: "wifi",
    items: [
      "Na Hora Ceilândia",
      "Na Hora Taguatinga",
      "Na Hora Rodoviária Plano Piloto",
      "Na Hora Gama",
      "Na Hora Brazlândia",
      "Na Hora Sobradinho",
      "SESI LAB",
      "Biblioteca da Ceilândia",
    ],
  },
];

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

export function Points() {
  const [active, setActive] = useState<CategoryKey | "todos">("todos");
  const [highlightCity, setHighlightCity] = useState<string | null>(null);
  const header = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const mapReveal = useReveal<HTMLDivElement>({ threshold: 0.15 });
  const tabsReveal = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const listReveal = useReveal<HTMLDivElement>({ threshold: 0.1 });

  const filteredCategories = useMemo(
    () => (active === "todos" ? categories : categories.filter((c) => c.key === active)),
    [active],
  );

  const handleCitySelect = (cityName: string) => {
    setActive("todos");
    setHighlightCity(cityName);
    listReveal.ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isCityMatch = (item: string, city: string) => item.includes(city) || city.includes(item);

  return (
    <section id="pontos" className="relative bg-navy text-off-white py-24 md:py-32 px-6 overflow-hidden">
      {/* subtle signal arcs backdrop */}
      <svg aria-hidden className="absolute inset-0 h-full w-full opacity-40 pointer-events-none">
        <g fill="none" strokeWidth="1">
          <circle cx="95%" cy="-5%" r="220" stroke="#F2B705" strokeOpacity="0.18" strokeDasharray="380 900" />
          <circle cx="95%" cy="-5%" r="380" stroke="#2DD4BF" strokeOpacity="0.12" strokeDasharray="600 1400" />
          <circle cx="95%" cy="-5%" r="560" stroke="#F2B705" strokeOpacity="0.08" strokeDasharray="900 2000" />
        </g>
      </svg>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div ref={header.ref} data-visible={header.visible} className="reveal-root max-w-3xl">
          <div className="reveal reveal-1 font-mono text-xs uppercase tracking-[0.3em] text-gold mb-5">
            / NOSSOS PONTOS
          </div>
          <h2 className="reveal reveal-2 font-display font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
            53 pontos. 16 cidades. Um só mapa.
          </h2>
          <p className="reveal reveal-3 mt-5 text-white/70 text-base md:text-lg leading-relaxed">
            A MOBTV possui a maior cobertura WIFI e o maior impacto em DOOH do Distrito Federal — presente em estações de metrô, terminais de BRT, hospitais, feiras e pontos de serviço.
          </p>
        </div>

        {/* Block 1 — Map */}
        <div
          ref={mapReveal.ref}
          data-visible={mapReveal.visible}
          className="reveal-root mt-14 md:mt-16"
        >
          <div className="reveal reveal-1 relative rounded-2xl border border-white/10 bg-[color-mix(in_oklab,var(--navy-soft)_60%,transparent)] p-6 md:p-10 backdrop-blur-sm">
            <CoverageMap onCitySelect={handleCitySelect} />
          </div>
        </div>

        {/* Block 2 — Tabs */}
        <div
          ref={tabsReveal.ref}
          data-visible={tabsReveal.visible}
          className="reveal-root mt-14"
        >
          <div className="reveal reveal-1 flex flex-wrap gap-2 md:gap-3">
            {tabs.map((t) => {
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setActive(t.key);
                    setHighlightCity(null);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
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
        </div>

        {/* Block 3 — Category list */}
        <div
          ref={listReveal.ref}
          data-visible={listReveal.visible}
          className="reveal-root mt-10"
        >
          <div className="grid gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((cat, i) => (
              <div
                key={cat.key}
                className={`reveal reveal-${(i % 5) + 1} last:lg:col-start-2 rounded-2xl border border-white/10 bg-[color-mix(in_oklab,var(--navy-soft)_55%,transparent)] p-6 backdrop-blur-sm`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${connectivityBadgeClasses[cat.connectivity]}`}
                  >
                    <cat.icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-gold">
                    {cat.label}
                  </h3>
                </div>
                <ul className="mt-4 space-y-2">
                  {cat.items.map((item) => {
                    const isHighlighted = highlightCity ? isCityMatch(item, highlightCity) : false;
                    return (
                      <li
                        key={item}
                        className={`flex items-start gap-2 rounded-md -mx-1.5 px-1.5 py-1 text-sm transition-colors duration-300 ${
                          isHighlighted ? "bg-gold/15 text-white ring-1 ring-gold/40" : "text-white/75"
                        }`}
                      >
                        <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none text-teal/80" strokeWidth={1.8} />
                        <span>{item}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
