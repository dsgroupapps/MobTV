import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";
import { Camera, Eye, MessageCircle, MapPin } from "lucide-react";
import painelImg from "@/assets/media-painel.jpg";

const diferenciais = [
  {
    icon: Camera,
    title: "Auditoria real",
    desc: "Impactos contados por câmera + IA, não estimados (Datavisiooh)",
  },
  {
    icon: Eye,
    title: "Viewability 100%",
    desc: "No WiFi Ads, só contam engajamentos entregues por completo",
  },
  {
    icon: MessageCircle,
    title: "Captação de Leads",
    desc: "Usuário inicia conversa com sua marca via WhatsApp direto da conexão",
  },
  {
    icon: MapPin,
    title: "Cobertura única",
    desc: "Metrô, BRT, UPAs, hospitais e feiras: onde o DF passa todos os dias",
  },
];

export function HomeDiferenciais() {
  const { ref, visible } = useReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section className="bg-off-white text-ink py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div ref={ref} data-visible={visible} className="reveal-root">
          <div className="max-w-3xl">
            <p className="reveal reveal-1 font-mono text-xs tracking-widest text-gold-deep">
              / POR QUE ANUNCIAR
            </p>
            <h2 className="reveal reveal-2 font-display font-bold text-3xl md:text-5xl mt-3 text-ink leading-tight tracking-tight">
              Uma rede de benefícios
            </h2>
            <p className="reveal reveal-3 mt-5 text-ink-soft text-base md:text-lg leading-relaxed">
              Não basta conectar a população a um WiFi de qualidade. A experiência precisa ser
              simples para o usuário e transparente para o anunciante.
            </p>
          </div>

          <div className="mt-14 md:mt-16 grid grid-cols-1 lg:grid-cols-[45%_1fr] gap-10 lg:gap-16 items-center">
            {/* Image */}
            <div className="reveal reveal-2 relative overflow-hidden rounded-2xl shadow-[0_20px_50px_-20px_rgba(11,18,32,0.3)]">
              <img
                src={painelImg}
                alt="Painel de LED da MOBTV em estação de metrô"
                loading="lazy"
                width={1024}
                height={768}
                className="block w-full h-[360px] md:h-[440px] object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent" />
            </div>

            {/* Diferenciais list */}
            <div>
              <ul className="divide-y divide-black/5 rounded-2xl border border-black/5 bg-white shadow-sm">
                {diferenciais.map((d, i) => {
                  const Icon = d.icon;
                  return (
                    <li
                      key={d.title}
                      className={`reveal reveal-${Math.min(i + 1, 5)} flex items-start gap-4 px-6 py-5`}
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white border border-gold/40 shadow-sm">
                        <Icon className="w-5 h-5 text-gold-deep" />
                      </span>
                      <div>
                        <div className="font-display text-lg font-semibold text-ink">
                          {d.title}
                        </div>
                        <p className="mt-1 text-sm text-ink-soft leading-relaxed">{d.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/midia"
              className="font-mono text-sm text-gold-deep hover:text-ink transition-colors"
            >
              Conheça todos os benefícios e formatos →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
