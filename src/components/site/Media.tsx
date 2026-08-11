import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";
import {
  Check,
  Wifi,
  UserRoundCheck,
  Image as ImageIcon,
  Play,
  MousePointerClick,
  MessageCircle,
  Send,
  Users,
  ShoppingBag,
} from "lucide-react";
import envelopamentoImg from "@/assets/media-envelopamento.jpg";
import imersivaImg from "@/assets/media-imersiva.jpg";
import catracasImg from "@/assets/media-catracas.jpg";
import painelImg from "@/assets/media-painel.jpg";

const possibilidades = [
  "Nome da empresa no SSID da rede (ex: WiFi Free Minha Empresa)",
  "Background personalizado",
  "Banner de boas-vindas (Banner 1)",
  'Vídeo de até 30" da campanha',
  "Banner de liberação de acesso ao WiFi (Banner 2)",
  "Menu personalizado no Canal de Conteúdos, com vídeos e textos",
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
  { icon: Wifi, body: "Usuário acessa uma das redes WiFi e aceita os Termos de Uso." },
  {
    icon: MessageCircle,
    body: 'É impactado pela publicidade e clica em "Conecte-se e Saiba Mais".',
  },
  { icon: Send, body: "O anunciante recebe os leads qualificados em tempo real." },
  {
    icon: ShoppingBag,
    body: "Usuário recebe atendimento personalizado e pode finalizar a compra.",
  },
];

const metroCards = [
  {
    title: "Envelopamento de Vagão",
    body: "O envelopamento externo do vagão traz o efeito 'uau' que chama a atenção de todos os usuários do Metrô.",
    image: envelopamentoImg,
  },
  {
    title: "Experiência Imersiva",
    body: "Adesivação interna que cria uma experiência imersiva, gerando ainda mais reforço de marca.",
    image: imersivaImg,
  },
  {
    title: "Adesivação de Catracas",
    body: "Mídia off que conversa com a mídia on. Alto impacto em qualquer estação de Brasília.",
    image: catracasImg,
  },
  {
    title: "Painel Estático",
    body: "Maior visibilidade, pontos estratégicos, grande fluxo de pessoas e excelente número de impactos.",
    image: painelImg,
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
            A rede WiFi Ads da MOBTV possui um exclusivo conjunto de possibilidades de mídia — e vai
            muito além da tela do celular.
          </p>
        </div>

        {/* BLOCO 1 — Possibilidades */}
        <div ref={bloco1.ref} data-visible={bloco1.visible} className="reveal-root mb-24">
          <h3 className="reveal reveal-1 font-display font-semibold text-ink text-2xl mb-8">
            Possibilidades de Anúncio
          </h3>
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

        {/* BLOCO 2 — Como funciona a conexão */}
        <div ref={bloco2.ref} data-visible={bloco2.visible} className="reveal-root mb-24">
          <h3 className="font-display font-semibold text-ink text-2xl mb-10 text-center">
            Como funciona a conexão
          </h3>
          <div className="flex flex-wrap justify-center items-start gap-x-2 gap-y-8 mb-10">
            {fluxo.map((f, i) => (
              <div key={f.title} className="flex items-center">
                <div
                  className="media-phone-stagger"
                  style={{
                    animationDelay: bloco2.visible ? `${i * 150}ms` : "0ms",
                    animationPlayState: bloco2.visible ? "running" : "paused",
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

        {/* BLOCO 3 — Captação de Leads via WhatsApp */}
        <div ref={bloco3.ref} data-visible={bloco3.visible} className="reveal-root mb-24">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-navy to-navy-soft text-off-white p-8 md:p-14">
            <div className="max-w-3xl">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold mb-4">
                / WHATSAPP
              </div>
              <h3 className="font-display font-semibold text-2xl md:text-3xl mb-5">
                Captação de Leads
              </h3>
              <p className="text-off-white/80 leading-relaxed mb-10">
                Oferecemos a possibilidade do usuário iniciar uma conversa com o anunciante pelo
                WhatsApp. Clicando no botão "Saber mais e conectar", o usuário recebe a internet
                gratuita e o anunciante recebe o lead do interessado no produto ou serviço.
              </p>
            </div>

            <h4 className="font-display font-semibold text-lg md:text-xl mb-6 text-gold">
              Jornada do Lead
            </h4>

            <div className="relative grid md:grid-cols-4 gap-8 md:gap-4">
              {/* connector line (desktop) */}
              <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px bg-gold/30 overflow-hidden">
                <div
                  className="h-full bg-gold origin-left transition-transform duration-[1400ms] ease-out"
                  style={{
                    transform: bloco3.visible ? "scaleX(1)" : "scaleX(0)",
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
                      opacity: bloco3.visible ? 1 : 0,
                      transform: bloco3.visible ? "translateY(0)" : "translateY(20px)",
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

        {/* BLOCO 4 — Mídia Estática no Metrô */}
        <div ref={bloco4.ref} data-visible={bloco4.visible} className="reveal-root">
          <h3 className="reveal reveal-1 font-display font-semibold text-ink text-2xl mb-2">
            Mídia Estática no Metrô
          </h3>
          <p className="reveal reveal-2 text-ink-soft mb-10 max-w-2xl">
            Ative sua marca no metrô do DF com formatos de alto impacto.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metroCards.map((card, i) => (
              <div
                key={card.title}
                className="group relative rounded-2xl overflow-hidden h-[340px] shadow-md hover:shadow-xl transition-shadow"
                style={{
                  opacity: bloco4.visible ? 1 : 0,
                  transform: bloco4.visible ? "translateY(0)" : "translateY(24px)",
                  transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                <img
                  src={card.image}
                  alt={card.title}
                  width={1024}
                  height={768}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-6 text-off-white">
                  <h4 className="font-display font-semibold text-xl mb-2">{card.title}</h4>
                  <p className="text-sm text-off-white/85 leading-snug">{card.body}</p>
                </div>
              </div>
            ))}
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
            Escolha ambiente, mídia e pontos reais da rede, com investimento simulado a partir da
            tabela comercial vigente.
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
