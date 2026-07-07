import { useReveal } from "@/hooks/useReveal";
import { MapPin, Mail } from "lucide-react";

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.6 6.3A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-6.8 12L4 20l4.1-1.1a7.94 7.94 0 0 0 3.9 1A7.94 7.94 0 0 0 20 12a7.85 7.85 0 0 0-2.4-5.7Zm-5.6 12.2a6.6 6.6 0 0 1-3.4-.9l-.2-.1-2.4.6.6-2.4-.2-.2A6.6 6.6 0 1 1 18.6 12 6.6 6.6 0 0 1 12 18.5Zm3.6-4.9c-.2-.1-1.2-.6-1.4-.6s-.3-.1-.5.1-.5.6-.6.8-.3.2-.5.1a5.4 5.4 0 0 1-1.6-1 6 6 0 0 1-1.1-1.4c-.1-.2 0-.3.1-.4l.3-.4.2-.3v-.3l-.6-1.4c-.1-.4-.3-.3-.4-.3h-.3a.7.7 0 0 0-.5.2 2 2 0 0 0-.7 1.6 3.6 3.6 0 0 0 .8 2 8.1 8.1 0 0 0 3.1 2.7c.4.2.8.3 1 .4a2.5 2.5 0 0 0 1.1.1 1.8 1.8 0 0 0 1.2-.9 1.5 1.5 0 0 0 .1-.9c0-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}

export function Contact() {
  const { ref, visible } = useReveal<HTMLElement>({ threshold: 0.12 });

  return (
    <section
      id="contato"
      ref={ref}
      data-visible={visible}
      className="reveal-root bg-navy py-20 md:py-28"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14 md:mb-16">
          <p className="reveal reveal-1 font-mono text-sm text-gold tracking-widest mb-4">
            / CONTATO
          </p>
          <h2 className="reveal reveal-2 font-display text-3xl md:text-5xl font-bold text-off-white leading-tight mb-4">
            Vamos colocar sua marca no ar
          </h2>
          <p className="reveal reveal-3 text-base md:text-lg text-off-white/70 max-w-2xl mx-auto">
            Fale com a nossa equipe e descubra o melhor formato para a sua campanha.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {/* Card 1 — Endereço */}
          <div className="reveal reveal-2 bg-indigo/40 backdrop-blur-sm border border-gold/20 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 text-gold mb-5">
              <MapPin size={22} />
            </div>
            <h3 className="font-display text-lg font-semibold text-off-white mb-2">
              Endereço
            </h3>
            <p className="text-sm text-off-white/70 leading-relaxed">
              SIG Quadra 8, lote 2268
              <br />
              Brasília - DF, 70610-400
            </p>
          </div>

          {/* Card 2 — WhatsApp */}
          <div className="reveal reveal-3 bg-indigo/40 backdrop-blur-sm border border-gold/20 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 text-gold mb-5">
              <WhatsAppIcon size={22} />
            </div>
            <h3 className="font-display text-lg font-semibold text-off-white mb-2">
              WhatsApp
            </h3>
            <a
              href="#"
              className="text-sm text-off-white/70 hover:text-gold transition-colors"
              // TODO: link real — substituir por https://wa.me/5561992590234
            >
              +55 (61) 99259-0234
            </a>
          </div>

          {/* Card 3 — E-mail */}
          <div className="reveal reveal-4 bg-indigo/40 backdrop-blur-sm border border-gold/20 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 text-gold mb-5">
              <Mail size={22} />
            </div>
            <h3 className="font-display text-lg font-semibold text-off-white mb-2">
              E-mail
            </h3>
            <a
              href="#"
              className="text-sm text-off-white/70 hover:text-gold transition-colors"
              // TODO: link real — substituir por mailto:comercial@mobtv.tv.br
            >
              comercial@mobtv.tv.br
            </a>
          </div>
        </div>

        {/* Política de Privacidade */}
        <div className="text-center mb-12">
          <a
            href="#"
            className="text-sm text-gold underline underline-offset-4 hover:text-gold-deep transition-colors"
            // TODO: link real — substituir pelo link da política de privacidade
          >
            Política de Privacidade
          </a>
        </div>

        {/* CTA */}
        <div className="reveal reveal-3 text-center">
          <a href="#" className="btn-primary text-base md:text-lg px-8 py-4">
            Anuncie Agora
          </a>
        </div>
      </div>
    </section>
  );
}
