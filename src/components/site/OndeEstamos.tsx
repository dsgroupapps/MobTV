import { networkPoints } from "@/data/network-points";

const locations = networkPoints.flatMap((category) => category.points.map((point) => point.nome));

export function OndeEstamos() {
  return (
    <div className="relative overflow-hidden bg-navy border-y border-gold/10 pt-6 pb-5">
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-28 z-10 bg-gradient-to-r from-navy to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-28 z-10 bg-gradient-to-l from-navy to-transparent" />

      <div className="marquee-track flex w-max items-center whitespace-nowrap">
        {[...locations, ...locations].map((loc, i) => (
          <span key={i} className="flex items-center">
            <span className="font-mono text-xs tracking-wide text-gold/50 px-4">{loc}</span>
            <span aria-hidden className="font-mono text-xs text-white/15">
              •
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
