interface Props {
  id: string;
  title: string;
  variant: "light" | "dark";
}

export function SectionPlaceholder({ id, title, variant }: Props) {
  const isDark = variant === "dark";
  return (
    <section
      id={id}
      className={`min-h-[70vh] flex items-center justify-center px-6 py-24 ${
        isDark ? "bg-navy text-off-white" : "bg-off-white text-ink"
      }`}
    >
      <div className="text-center">
        <div
          className={`font-mono text-xs uppercase tracking-[0.3em] mb-4 ${
            isDark ? "text-gold" : "text-gold-deep"
          }`}
        >
          / {id}
        </div>
        <h2 className="font-display text-5xl md:text-6xl font-bold">{title}</h2>
      </div>
    </section>
  );
}
