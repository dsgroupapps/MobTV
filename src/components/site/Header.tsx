import { useEffect, useState } from "react";

const navItems = [
  { id: "inicio", label: "Início" },
  { id: "sobre", label: "Sobre Nós" },
  { id: "resultados", label: "Resultados" },
  { id: "rede", label: "Nossa Rede" },
  { id: "beneficios", label: "Benefícios" },
  { id: "midia", label: "Mídia" },
  { id: "pontos", label: "Nossos Pontos" },
  { id: "galeria", label: "Galeria" },
  { id: "contato", label: "Contato" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("inicio");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);

      // Determine active section based on viewport position
      const offset = window.innerHeight / 3;
      let current = active;
      for (const item of navItems) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - offset <= 0) current = item.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [active]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 bg-off-white transition-shadow duration-200 ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <a href="#inicio" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-navy tracking-tight">
            MOB<span className="text-gold-deep">TV</span>
          </span>
        </a>
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active === item.id
                  ? "bg-gold text-navy"
                  : "text-ink hover:text-gold-deep"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
