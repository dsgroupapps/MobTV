import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";
import {
  Check,
  CircleCheckBig,
  Image as ImageIcon,
  MapPin,
  MonitorPlay,
  Play,
  MousePointerClick,
  Repeat2,
  Wifi,
  UserRoundCheck,
} from "lucide-react";
import { mediaFormatExamples } from "@/data/media-format-examples";

const possibilidades = [
  "Nome da empresa no SSID da rede (ex: WiFi Free Minha Empresa)",
  "Background personalizado",
  "Banner de boas-vindas (Banner 1)",
  'Vídeo de até 30" da campanha',
  "Banner de liberação de acesso ao WiFi (Banner 2)",
  "Enquete/pesquisa para coleta de dados que ajudam na jornada de vendas",
];

const fluxo = [
  { icon: Wifi, title: "Tela Inicial", body: "Usuário seleciona a rede WiFi Social MOBTV." },
  { icon: UserRoundCheck, title: "Dados Validados", body: "Nome, e-mail e aceite dos termos." },
  { icon: ImageIcon, title: "Banner 1", body: "Boas-vindas com a campanha do anunciante." },
  { icon: Play, title: "Vídeo", body: "Vídeo de até 30 segundos da campanha." },
  { icon: MousePointerClick, title: "Banner 2", body: "Banner final com CTA de conexão." },
];

const jornada = [
  {
    icon: MapPin,
    body: "O público circula por pontos estratégicos da rede MOBTV.",
  },
  {
    icon: MonitorPlay,
    body: "É impactado pela comunicação exibida em telas e painéis.",
  },
  {
    icon: Repeat2,
    body: "A presença recorrente reforça a mensagem ao longo da jornada.",
  },
  {
    icon: CircleCheckBig,
    body: "A marca ganha frequência, lembrança e presença no cotidiano.",
  },
];

const mediaProducts = [
  {
    ...mediaFormatExamples[0],
    eyebrow: "Produto prioritário",
    body: "Grande formato em pontos estratégicos, pensado para impacto imediato, alto fluxo e presença de marca.",
  },
  {
    ...mediaFormatExamples[1],
    eyebrow: "Alcance e performance",
    body: "Publicidade integrada à conexão gratuita, com banners, vídeo e mensuração por engajamento.",
  },
  {
    ...mediaFormatExamples[2],
    eyebrow: "DOOH na jornada",
    body: "Monitores em locais de espera, circulação e atendimento para reforçar frequência e presença da campanha.",
  },
  {
    ...mediaFormatExamples[3],
    eyebrow: "Experiência embarcada",
    body: "Aplicações internas que acompanham o deslocamento e criam uma camada adicional de lembrança de marca.",
  },
  {
    ...mediaFormatExamples[4],
    eyebrow: "Ponto de passagem",
    body: "Formato de alto contato visual nos acessos, ideal para ativar presença em rotas de entrada e saída.",
  },
  {
    ...mediaFormatExamples[5],
    eyebrow: "Impacto especial",
    body: "Aplicação externa de grande escala para campanhas que precisam ocupar o ambiente com forte presença visual.",
  },
];

function PhoneScreen({
  index,
  title,
  Icon,
  body,
}: {
  index: number;
  title: string;
  Icon: typeof Wifi;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[130px] h-[260px] rounded-[26px] bg-navy border-[3px] border-navy shadow-xl overflow-hidden">
        {/* notch */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-black rounded-full z-10" />
        {/* screen */}
        <div className="absolute inset-1 rounded-[20px] bg-off-white flex flex-col items-center justify-center p-3 text-center">
          <div className="mt-3 mb-2 w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center">
            <Icon size={20} className="text-gold-deep" />
          </div>
          <div className="font-display font-semibold text-ink text-[13px] leading-tight mb-1">
            {title}
          </div>
          <div className="font-sans text-[10px] text-ink-soft leading-snug">{body}</div>
          <div className="mt-auto font-mono text-[9px] text-gold-deep">0{index}/05</div>
        </div>
      </div>
    </div>
  );
}

type MediaProduct = (typeof mediaProducts)[number];

function MediaProductCard({
  product,
  rank,
  variant,
}: {
  product: MediaProduct;
  rank: number;
  variant: "hero" | "primary" | "compact";
}) {
  const sizeClass =
    variant === "hero"
      ? "h-[420px] md:h-[520px]"
      : variant === "primary"
        ? "h-[340px] md:h-[420px]"
        : "h-[300px] md:h-[340px]";
  const titleClass =
    variant === "hero"
      ? "text-3xl md:text-5xl"
      : variant === "primary"
        ? "text-2xl md:text-4xl"
        : "text-xl md:text-2xl";

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl bg-navy text-off-white shadow-[0_16px_48px_-18px_rgba(11,18,32,0.42)] ${sizeClass}`}
    >
      <img
        src={product.image}
        alt={`Formato de mídia MOBTV — ${product.title}`}
        loading="lazy"
        style={{ objectPosition: product.objectPosition }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/45 to-navy/5" />
      <div className="relative flex h-full flex-col justify-end p-6 md:p-8">
        <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-gold">
          <span>0{rank}</span>
          <span className="text-off-white/35">/</span>
          <span>{product.eyebrow}</span>
        </div>
        <h4 className={`font-display font-bold leading-tight ${titleClass}`}>{product.title}</h4>
        <p className="mt-3 max-w-xl text-sm md:text-base text-off-white/82 leading-relaxed">
          {product.body}
        </p>
      </div>
    </article>
  );
}

export function Media() {
  const header = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const bloco1 = useReveal<HTMLDivElement>({ threshold: 0.15 });
  const bloco2 = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const bloco3 = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const bloco4 = useReveal<HTMLDivElement>({ threshold: 0.15 });

  return (
    <section id="midia" className="bg-off-white text-ink py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div ref={header.ref} data-visible={header.visible} className="reveal-root max-w-3xl mb-16">
          <div className="reveal reveal-1 font-mono text-xs uppercase tracking-[0.3em] text-gold-deep mb-5">
            / MÍDIA
          </div>
          <h2 className="reveal reveal-2 font-display font-bold text-ink text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
            Sua marca, do WiFi ao vagão do Metrô
          </h2>
          <p className="reveal reveal-3 mt-6 text-ink-soft text-lg leading-relaxed">
            A MOBTV combina painéis, Wi-Fi Ads, telas e formatos especiais para colocar marcas nos
            principais fluxos de circulação do Distrito Federal.
          </p>
        </div>

        {/* BLOCO 1 — Possibilidades de mídia */}
        <div ref={bloco1.ref} data-visible={bloco1.visible} className="reveal-root mb-24">
          <h3 className="reveal reveal-1 font-display font-semibold text-ink text-2xl mb-8">
            Possibilidades de mídia
          </h3>
          <div className="reveal reveal-2 flex flex-col gap-6 md:gap-8">
            <MediaProductCard product={mediaProducts[0]} rank={1} variant="hero" />

            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
              {mediaProducts.slice(1, 3).map((product, index) => (
                <MediaProductCard
                  key={product.key}
                  product={product}
                  rank={index + 2}
                  variant="primary"
                />
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {mediaProducts.slice(3).map((product, index) => (
                <MediaProductCard
                  key={product.key}
                  product={product}
                  rank={index + 4}
                  variant="compact"
                />
              ))}
            </div>
          </div>
        </div>

        {/* BLOCO 2 — Ativações em Wi-Fi Ads */}
        <div ref={bloco2.ref} data-visible={bloco2.visible} className="reveal-root mb-24">
          <h3 className="reveal reveal-1 font-display font-semibold text-ink text-2xl mb-4">
            Ativações em Wi-Fi Ads
          </h3>
          <p className="reveal reveal-2 text-ink-soft mb-8 max-w-2xl">
            Além da presença visual nos pontos, o Wi-Fi Ads permite campanhas com etapas digitais,
            coleta de dados e chamada direta para conversão.
          </p>
          <ul className="grid md:grid-cols-2 gap-x-10 gap-y-4">
            {possibilidades.map((p, i) => (
              <li key={p} className={`reveal reveal-${Math.min(i + 2, 5)} flex items-start gap-3`}>
                <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-gold/15 flex items-center justify-center">
                  <Check size={14} className="text-gold-deep" strokeWidth={3} />
                </span>
                <span className="text-ink leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* BLOCO 3 — Como funciona a conexão */}
        <div ref={bloco3.ref} data-visible={bloco3.visible} className="reveal-root mb-24">
          <h3 className="font-display font-semibold text-ink text-2xl mb-10 text-center">
            Como funciona a conexão
          </h3>
          <div className="flex flex-wrap justify-center items-start gap-x-2 gap-y-8 mb-10">
            {fluxo.map((f, i) => (
              <div key={f.title} className="flex items-center">
                <div
                  className="media-phone-stagger"
                  style={{
                    animationDelay: bloco3.visible ? `${i * 150}ms` : "0ms",
                    animationPlayState: bloco3.visible ? "running" : "paused",
                  }}
                >
                  <PhoneScreen index={i + 1} title={f.title} Icon={f.icon} body={f.body} />
                </div>
                {i < fluxo.length - 1 && (
                  <div className="hidden lg:block mx-1 h-px w-8 bg-gold/50 relative" aria-hidden>
                    <span className="absolute -right-1 -top-1 w-2 h-2 border-t border-r border-gold rotate-45" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="max-w-3xl mx-auto text-center font-display font-semibold text-ink text-lg md:text-xl leading-relaxed">
            Sempre que uma pessoa se conecta à rede, são exibidas telas personalizadas com a
            campanha do anunciante — um conjunto exclusivo de vídeo e banners. Isso tudo em um único
            preço.
          </p>
        </div>

        {/* BLOCO 4 — Jornada de exposição */}
        <div ref={bloco4.ref} data-visible={bloco4.visible} className="reveal-root">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-navy to-navy-soft text-off-white p-8 md:p-14">
            <div className="max-w-3xl">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold mb-4">
                / PRESENÇA DE MARCA
              </div>
              <h3 className="font-display font-semibold text-2xl md:text-3xl mb-5">
                Jornada de exposição
              </h3>
              <p className="text-off-white/80 leading-relaxed mb-10">
                A mídia acompanha a rotina do público em ambientes de circulação e permanência,
                aumentando a frequência de contato com a marca.
              </p>
            </div>

            <h4 className="font-display font-semibold text-lg md:text-xl mb-6 text-gold">
              Quatro momentos de exposição
            </h4>

            <div className="relative grid md:grid-cols-4 gap-8 md:gap-4">
              {/* connector line (desktop) */}
              <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px bg-gold/30 overflow-hidden">
                <div
                  className="h-full bg-gold origin-left transition-transform duration-[1400ms] ease-out"
                  style={{
                    transform: bloco4.visible ? "scaleX(1)" : "scaleX(0)",
                  }}
                />
              </div>

              {jornada.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={i}
                    className="relative flex flex-col items-center text-center transition-all duration-700"
                    style={{
                      opacity: bloco4.visible ? 1 : 0,
                      transform: bloco4.visible ? "translateY(0)" : "translateY(20px)",
                      transitionDelay: `${300 + i * 250}ms`,
                    }}
                  >
                    <div className="relative z-10 w-16 h-16 rounded-full bg-gold text-navy flex items-center justify-center shadow-lg">
                      <Icon size={24} />
                    </div>
                    <div className="mt-3 font-mono text-xs text-gold">0{i + 1}</div>
                    <p className="mt-2 text-sm text-off-white/85 leading-snug max-w-[220px]">
                      {step.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA contextual — já viu os formatos, agora monta a campanha */}
        <div className="mt-20 md:mt-24 rounded-3xl bg-navy px-8 py-12 md:px-14 md:py-14 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold mb-4">
            / PRÓXIMO PASSO
          </div>
          <h3 className="font-display font-bold text-off-white text-2xl md:text-3xl leading-tight max-w-xl mx-auto">
            Já sabe o que quer? Monte sua campanha
          </h3>
          <p className="mt-4 text-off-white/70 max-w-lg mx-auto leading-relaxed">
            Escolha a mídia, navegue pelos pontos reais da rede e solicite uma proposta comercial.
          </p>
          <div className="mt-8">
            <Link to="/planejador" className="btn-primary px-8 py-4 text-base">
              Monte sua campanha →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
