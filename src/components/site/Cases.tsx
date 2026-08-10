import { useReveal } from "@/hooks/useReveal";
import caseEvolve from "@/assets/case-evolve.jpg";
import caseBluefit from "@/assets/case-bluefit.jpg";
import caseVivo from "@/assets/case-vivo.jpg";

/**
 * Cada campanha abaixo é uma execução real, fotografada no Media Kit oficial
 * (páginas 55–59, "Mídia Estática no Metrô"). Nenhum objetivo de campanha,
 * alcance ou resultado é declarado aqui — o Media Kit não traz essas
 * métricas para essas execuções específicas, só a descrição do formato.
 * Por isso os cases funcionam como prova visual de execução, não como
 * estudo de resultado.
 */
const cases = [
  {
    cliente: "Evolve",
    segmento: undefined,
    midia: "Envelopamento de vagão",
    ambiente: "Metrô-DF",
    descricao:
      "Adesivação externa completa de um vagão — o formato de maior impacto visual da rede, criado para chamar atenção de todos os usuários da estação.",
    imagem: caseEvolve,
    aspect: "aspect-[21/9]",
  },
  {
    cliente: "Bluefit",
    segmento: "Academia / fitness",
    midia: "Adesivação interna (experiência imersiva)",
    ambiente: "Metrô-DF",
    descricao:
      "Interior do vagão inteiramente adesivado para recriar o ambiente da academia — reforço de marca pela imersão, não só pela exposição.",
    imagem: caseBluefit,
    aspect: "aspect-[4/5]",
  },
  {
    cliente: "Vivo Total",
    segmento: "Telecom",
    midia: "Painel estático",
    ambiente: "Corredor de estação de Metrô",
    descricao:
      "Painel de grande formato em ponto estratégico de alto fluxo — o formato mais tradicional da rede, em corredor de passagem obrigatória.",
    imagem: caseVivo,
    aspect: "aspect-[16/9]",
  },
];

export function Cases() {
  const header = useReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section id="cases" className="bg-off-white text-ink py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div ref={header.ref} data-visible={header.visible} className="reveal-root max-w-3xl">
          <div className="reveal reveal-1 font-mono text-xs uppercase tracking-[0.3em] text-gold-deep mb-5">
            / CASES
          </div>
          <h2 className="reveal reveal-2 font-display font-bold text-ink text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
            Marcas que já ocuparam a rede
          </h2>
          <p className="reveal reveal-3 mt-5 text-ink-soft text-base md:text-lg leading-relaxed">
            Execuções reais, fotografadas em campo — sem alcance, conversão ou ROI estimados: o que
            não temos números auditados para afirmar, não afirmamos.
          </p>
        </div>

        <div className="mt-16 md:mt-20 flex flex-col gap-20 md:gap-28">
          {/* Case 1 — Evolve: full-bleed wide, texto abaixo */}
          <CaseWide item={cases[0]} />

          {/* Case 2 e 3 — assimétrico, imagem grande + imagem menor lado a lado */}
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-10 items-end">
            <CaseTall item={cases[1]} />
            <CaseTall item={cases[2]} />
          </div>
        </div>
      </div>
    </section>
  );
}

type CaseItem = (typeof cases)[number];

function CaseMeta({ item }: { item: CaseItem }) {
  return (
    <div className="mt-5 flex flex-col gap-1.5">
      <div className="font-display text-2xl md:text-3xl font-bold text-ink">{item.cliente}</div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-wider text-gold-deep">
        <span>{item.midia}</span>
        <span className="text-ink-soft/40">·</span>
        <span className="text-teal">{item.ambiente}</span>
        {item.segmento && (
          <>
            <span className="text-ink-soft/40">·</span>
            <span className="text-ink-soft">{item.segmento}</span>
          </>
        )}
      </div>
      <p className="mt-2 max-w-xl text-sm md:text-base text-ink-soft leading-relaxed">
        {item.descricao}
      </p>
    </div>
  );
}

function CaseWide({ item }: { item: CaseItem }) {
  const reveal = useReveal<HTMLDivElement>({ threshold: 0.15 });
  return (
    <div ref={reveal.ref} data-visible={reveal.visible} className="reveal-root">
      <div className="reveal reveal-1">
        <div
          className={`w-full overflow-hidden rounded-2xl ${item.aspect} shadow-[0_16px_48px_-16px_rgba(11,18,32,0.35)]`}
        >
          <img
            src={item.imagem}
            alt={`${item.cliente} — ${item.midia} na rede MOBTV`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <CaseMeta item={item} />
      </div>
    </div>
  );
}

function CaseTall({ item }: { item: CaseItem }) {
  const reveal = useReveal<HTMLDivElement>({ threshold: 0.15 });
  return (
    <div ref={reveal.ref} data-visible={reveal.visible} className="reveal-root">
      <div className="reveal reveal-1">
        <div
          className={`w-full overflow-hidden rounded-2xl ${item.aspect} shadow-[0_16px_48px_-16px_rgba(11,18,32,0.35)]`}
        >
          <img
            src={item.imagem}
            alt={`${item.cliente} — ${item.midia} na rede MOBTV`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <CaseMeta item={item} />
      </div>
    </div>
  );
}
