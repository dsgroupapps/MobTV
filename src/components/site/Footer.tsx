import { Logo } from "@/components/site/Logo";

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.6 6.3A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-6.8 12L4 20l4.1-1.1a7.94 7.94 0 0 0 3.9 1A7.94 7.94 0 0 0 20 12a7.85 7.85 0 0 0-2.4-5.7Zm-5.6 12.2a6.6 6.6 0 0 1-3.4-.9l-.2-.1-2.4.6.6-2.4-.2-.2A6.6 6.6 0 1 1 18.6 12 6.6 6.6 0 0 1 12 18.5Zm3.6-4.9c-.2-.1-1.2-.6-1.4-.6s-.3-.1-.5.1-.5.6-.6.8-.3.2-.5.1a5.4 5.4 0 0 1-1.6-1 6 6 0 0 1-1.1-1.4c-.1-.2 0-.3.1-.4l.3-.4.2-.3v-.3l-.6-1.4c-.1-.4-.3-.3-.4-.3h-.3a.7.7 0 0 0-.5.2 2 2 0 0 0-.7 1.6 3.6 3.6 0 0 0 .8 2 8.1 8.1 0 0 0 3.1 2.7c.4.2.8.3 1 .4a2.5 2.5 0 0 0 1.1.1 1.8 1.8 0 0 0 1.2-.9 1.5 1.5 0 0 0 .1-.9c0-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}

// Instagram, Facebook, LinkedIn e Google Maps foram removidos daqui: o Media
// Kit oficial não lista os perfis/handles reais da MOBTV, e um link "#" é
// pior do que nenhum link. Reintroduzir assim que a MOBTV informar as URLs.
export function Footer() {
  return (
    <footer className="bg-navy border-t border-gold/20">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <Logo variant="light" className="h-7" />

        {/* Contato direto */}
        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/5561992590234"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-gold/40 flex items-center justify-center text-gold hover:bg-gold hover:text-navy hover:border-gold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="WhatsApp"
          >
            <WhatsAppIcon size={18} />
          </a>
        </div>

        {/* Copyright */}
        <p className="text-xs text-off-white/50 font-mono">
          © 2026 MOBTV. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
