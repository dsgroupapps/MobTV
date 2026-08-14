import { useState } from "react";

// Assets oficiais em public/logos/ (não renomear/mover os arquivos-fonte).
// "NEGATIVA" = texto escuro (fundo claro/off-white); "POSITIVA" = texto branco (fundo navy).
const LOGO_SRC = {
  dark: "/logos/LOGO%20NEGATIVA.svg",
  light: "/logos/LOGO%20POSITIVA.svg",
} as const;

type LogoProps = {
  variant: "dark" | "light";
  className?: string;
};

/** Logo oficial MOBTV, com fallback para o wordmark textual se o SVG não carregar. */
export function Logo({ variant, className }: LogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`font-display font-bold tracking-tight ${
          variant === "dark" ? "text-navy" : "text-off-white"
        } ${className ?? ""}`}
      >
        MOB<span className={variant === "dark" ? "text-gold-deep" : "text-gold"}>TV</span>
      </span>
    );
  }

  return (
    <img
      src={LOGO_SRC[variant]}
      alt="MOBTV"
      className={`w-auto ${className ?? ""}`}
      onError={() => setFailed(true)}
    />
  );
}
