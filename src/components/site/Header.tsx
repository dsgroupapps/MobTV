import { useEffect, useState } from "react";
import { Logo } from "@/components/site/Logo";
import { Link, useLocation } from "@tanstack/react-router";
import { LogIn, Menu } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre Nós" },
  { to: "/rede", label: "Nossa Rede" },
  { to: "/midia", label: "Mídia" },
  { to: "/galeria", label: "Galeria" },
  { to: "/contato", label: "Contato" },
] as const;

// Número real do canal comercial (já usado em Contact.tsx / HomeContato.tsx).
const WHATSAPP_URL = "https://wa.me/5561992590234";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha o menu mobile automaticamente se a rota mudar por outro caminho
  // (ex.: botão voltar do navegador) além do clique direto no link.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 bg-off-white transition-shadow duration-200 ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Logo variant="dark" className="h-9" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                  isActive ? "bg-gold text-navy" : "text-ink hover:text-gold-deep"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Link
            to="/entrar"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-navy/20 px-4 text-sm font-semibold text-navy transition-colors hover:border-gold-deep hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Entrar
          </Link>

          {/* CTA comercial — desktop */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-red text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-red/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            Anuncie Agora
          </a>
        </div>

        {/* Menu mobile */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Abrir menu"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-navy cursor-pointer transition-colors hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Menu className="w-6 h-6" strokeWidth={2} />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-3/4 sm:max-w-sm bg-off-white flex flex-col">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <nav className="mt-10 flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                return (
                  <SheetClose asChild key={item.to}>
                    <Link
                      to={item.to}
                      className={`px-4 py-3 rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                        isActive ? "bg-gold text-navy" : "text-ink hover:text-gold-deep"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>

            <div className="mt-auto grid gap-3 pt-6 border-t border-ink/10">
              <SheetClose asChild>
                <Link
                  to="/entrar"
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-navy/20 px-5 py-3 text-base font-semibold text-navy transition-colors hover:border-gold-deep hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <LogIn className="h-5 w-5" aria-hidden />
                  Entrar
                </Link>
              </SheetClose>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center bg-red text-white rounded-lg px-5 py-3 text-base font-semibold transition-colors hover:bg-red/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                Anuncie Agora
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
