import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";

export function FloatingCTA() {
  const { pathname } = useLocation();
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolledPast(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Já existe um CTA equivalente no Header (sempre visível) e a própria
  // página de Contato é o destino deste botão — mostrá-lo ali seria
  // redundante. Aparece só depois que o visitante rola a página, para não
  // competir com o CTA do Header logo no primeiro viewport.
  const onContactPage = pathname.startsWith("/contato");
  const visible = scrolledPast && !onContactPage;

  return (
    <Link
      to="/contato"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-50 bg-red text-white rounded-full w-28 h-28 flex items-center justify-center text-center text-[11px] font-bold uppercase tracking-wide leading-tight px-3 shadow-xl transition-all duration-300 hover:scale-105 motion-safe:animate-mobtv-pulse ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      Anuncie
      <br />
      Agora
      <br />
      Mesmo!
    </Link>
  );
}
