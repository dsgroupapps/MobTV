import { useReveal } from "@/hooks/useReveal";
import { HeartPulse, Bus, Wifi, Store, Monitor } from "lucide-react";
import saudeImg from "@/assets/network-saude.jpg";
import transportesImg from "@/assets/network-transportes.jpg";
import servicosImg from "@/assets/network-servicos.jpg";
import feirasImg from "@/assets/network-feiras.jpg";

type Connectivity = "dual" | "wifi";

// dual = telas/painéis DOOH + WiFi; wifi = só rede WiFi Social (sem DOOH no Media Kit)
const cards: {
  icon: typeof HeartPulse;
  title: string;
  body: string;
  number: string;
  unit: string;
  image: string;
  connectivity: Connectivity;
}[] = [
  {
    icon: HeartPulse,
    title: "Saúde",
    body: "O Distrito Federal possui uma grande rede de atendimento à saúde — hospitais, UPAs e postos da Família, que recebem milhares de pessoas todos os dias. A rede WiFi grátis e DOOH da MOBTV já opera nesses locais, funcionando 24 horas por dia.",
    number: "250 mil",
    unit: "pessoas/mês",
    image: saudeImg,
    connectivity: "dual",
  },
  {
    icon: Bus,
    title: "Transportes",
    body: "Presente nas rodoviárias, Estações BRT e terminais do Metrô, de onde partem e chegam pessoas de todas as regiões do DF e entorno.",
    number: "3 milhões",
    unit: "pessoas/mês",
    image: transportesImg,
    connectivity: "dual",
  },
  {
    icon: Wifi,
    title: "Serviços",
    body: "Rede de internet de fácil acesso e sem custos através do projeto WiFi Social — presente em Restaurantes Comunitários, Bibliotecas Públicas, SESI Lab e Agências do Na Hora.",
    number: "90 mil",
    unit: "pessoas/mês",
    image: servicosImg,
    connectivity: "wifi",
  },
  {
    icon: Store,
    title: "Feiras",
    body: "Múltiplos impactos, tanto nas telas quanto na nossa exclusiva solução de WiFi patrocinado, em locais de alto fluxo e permanência prolongada.",
    number: "1,2 milhão",
    unit: "pessoas/mês",
    image: feirasImg,
    connectivity: "dual",
  },
];

const connectivityBadgeClasses: Record<Connectivity, string> = {
  dual: "text-navy [background:linear-gradient(135deg,var(--gold)_50%,var(--teal)_50%)]",
  wifi: "bg-teal/15 text-teal",
};

export function Network() {
  const header = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const grid = useReveal<HTMLDivElement>({ threshold: 0.15 });
  const below = useReveal<HTMLDivElement>({ threshold: 0.15 });

  return (
    <section id="rede" className="bg-off-white text-ink py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          ref={header.ref}
          data-visible={header.visible}
          className="reveal-root max-w-3xl"
        >
          <div className="reveal reveal-1 font-mono text-xs uppercase tracking-[0.3em] text-gold-deep mb-5">
            / NOSSA REDE
          </div>
          <h2 className="reveal reveal-2 font-display font-bold text-ink text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
            Onde o seu público já está
          </h2>
          <p className="reveal reveal-3 mt-5 text-ink-soft text-base md:text-lg leading-relaxed">
            A MOBTV possui a maior rede de WiFi e DOOH do Distrito Federal, presente nos locais de maior circulação de pessoas — não em qualquer lugar, nos lugares certos.
          </p>
        </div>

        {/* Block 1 — 4 photo cards, asymmetric grid */}
        <div
          ref={grid.ref}
          data-visible={grid.visible}
          className="reveal-root mt-16 md:mt-20"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 auto-rows-fr">
            {cards.map((c, i) => (
              <article
                key={c.title}
                className={`reveal reveal-${i + 1} group relative overflow-hidden rounded-2xl shadow-[0_8px_28px_-12px_rgba(11,18,32,0.35)] min-h-[400px] sm:min-h-[440px] lg:min-h-[480px]`}
              >
                {/* Background image */}
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {/* Gradient overlay */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-navy via-navy/75 to-navy/10"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-b from-navy/50 via-transparent to-transparent"
                />

                {/* Content */}
                <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-7 text-off-white">
                  {/* Icon — cor indica DOOH+WiFi (dual) ou só WiFi */}
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-sm ring-1 ring-white/20 ${connectivityBadgeClasses[c.connectivity]}`}
                  >
                    <c.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>

                  {/* Bottom cluster */}
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-gold/90">
                      {c.title}
                    </div>
                    <div className="mt-2 font-display font-bold text-white leading-none text-4xl md:text-5xl lg:text-[3.25rem]">
                      {c.number}
                    </div>
                    <div className="mt-1.5 font-mono text-xs text-white/70">
                      {c.unit}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-white/65 opacity-80 transition-opacity duration-300 group-hover:opacity-100">
                      {c.body}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Block 2 — WiFi Ads / DOOH */}
        <div
          ref={below.ref}
          data-visible={below.visible}
          className="reveal-root mt-20 md:mt-24"
        >
          <div className="grid gap-6 md:grid-cols-2">
            {/* WiFi Ads card — teal: rede/conectividade */}
            <div
              className="reveal reveal-1 relative overflow-hidden rounded-2xl border-t-[3px] border-teal bg-white p-8 md:p-10 shadow-[0_4px_20px_-8px_rgba(11,18,32,0.12)]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, color-mix(in oklab, var(--teal) 8%, transparent), transparent 70%)",
              }}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal/15 text-teal">
                <Wifi className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.28em] text-teal">
                / WiFi Ads
              </div>
              <h3 className="mt-2 font-display text-2xl md:text-3xl font-bold text-ink">
                Eficiência e Assertividade
              </h3>
              <p className="mt-4 text-ink-soft text-base leading-relaxed">
                O meio WiFi Ads tem crescido por ser referência de mídia eficiente, com entrega garantida, altos índices de qualidade (CTR e VTR) e por promover a inclusão digital de milhões de pessoas que diariamente acessam essas redes gratuitas, 100% financiadas pelo esforço publicitário.
              </p>
            </div>

            {/* DOOH card — dourado: telas/painéis */}
            <div
              className="reveal reveal-2 relative overflow-hidden rounded-2xl border-t-[3px] border-gold bg-white p-8 md:p-10 shadow-[0_4px_20px_-8px_rgba(11,18,32,0.12)]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, color-mix(in oklab, var(--gold) 8%, transparent), transparent 70%)",
              }}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                <Monitor className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.28em] text-gold-deep">
                / DOOH
              </div>
              <h3 className="mt-2 font-display text-2xl md:text-3xl font-bold text-ink">
                Excelente Cobertura
              </h3>
              <p className="mt-4 text-ink-soft text-base leading-relaxed">
                O meio DOOH é hoje o mais importante canal de comunicação exterior disponível no mercado. Onde o cliente está, há uma tela exercendo o papel de trazer informação para essas pessoas — alcançando milhares todos os dias em locais de grande concentração.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
