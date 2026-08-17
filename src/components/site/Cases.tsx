import { useReveal } from "@/hooks/useReveal";
import { mediaFormatExample } from "@/data/media-format-examples";

/**
 * Peças do Media Kit oficial (páginas 55–59, "Mídia Estática no Metrô")
 * usadas como MOCKUPS de aplicação dos formatos — não são campanhas reais
 * executadas pela MOBTV nem prova de que essas marcas anunciaram na rede.
 * A cópia abaixo não pode afirmar ou insinuar que são clientes/cases reais.
 */
const exemplos = [
  {
    ...mediaFormatExample("envelopamento"),
    label: "Exemplo de envelopamento",
    midia: "Envelopamento de vagão",
    ambiente: "Metrô-DF",
    descricao:
      "Adesivação externa completa de um vagão — o formato de maior impacto visual da rede. Simulação de aplicação, não uma campanha executada.",
    aspect: "aspect-[21/9]",
  },
  {
    ...mediaFormatExample("midia-interna"),
    label: "Exemplo de mídia interna",
    midia: "Adesivação interna (experiência imersiva)",
    ambiente: "Metrô-DF",
    descricao:
      "Interior do vagão inteiramente adesivado para recriar um ambiente de marca — simulação de como a imersão pode reforçar a presença, não uma campanha executada.",
    aspect: "aspect-[4/5]",
  },
  {
    ...mediaFormatExample("adesivacao-catracas"),
    label: "Exemplo de adesivação de catracas",
    midia: "Adesivação de catracas",
    ambiente: "Estação de Metrô-DF",
    descricao:
      "Mídia off que conversa com a mídia on, aplicada nas catracas de acesso — simulação de como o formato ganha alto impacto em qualquer estação, não uma campanha executada.",
    aspect: "aspect-[4/5]",
  },
  {
    ...mediaFormatExample("painel-estatico"),
    label: "Exemplo de painel estático",
    midia: "Painel estático",
    ambiente: "Corredor de estação de Metrô",
    descricao:
      "Painel de grande formato em ponto estratégico de alto fluxo — o formato mais tradicional da rede, em corredor de passagem obrigatória. Simulação de aplicação, não uma campanha executada.",
    aspect: "aspect-[21/9]",
  },
];

export function Cases() {
  const header = useReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <section id="cases" className="bg-off-white text-ink py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div ref={header.ref} data-visible={header.visible} className="reveal-root max-w-3xl">
          <div className="reveal reveal-1 font-mono text-xs uppercase tracking-[0.3em] text-gold-deep mb-5">
            / POSSIBILIDADES DE MÍDIA
          </div>
          <h2 className="reveal reveal-2 font-display font-bold text-ink text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight">
            Imagine sua marca ocupando a rede
          </h2>
          <p className="reveal reveal-3 mt-5 text-ink-soft text-base md:text-lg leading-relaxed">
            Exemplos visuais de como diferentes formatos podem ganhar presença nos ativos da MOBTV
            — simulações de aplicação, não campanhas executadas.
          </p>
        </div>

        <div className="mt-16 md:mt-20 flex flex-col gap-20 md:gap-28">
          {/* Exemplo 1 — envelopamento: full-bleed wide, texto abaixo */}
          <CaseWide item={exemplos[0]} />

          {/* Exemplo 2 e 3 — mídia interna + adesivação de catracas, lado a lado */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-end">
            <CaseTall item={exemplos[1]} />
            <CaseTall item={exemplos[2]} />
          </div>

          {/* Exemplo 4 — painel estático: full-bleed wide, mesma linguagem do primeiro */}
          <CaseWide item={exemplos[3]} />
        </div>
      </div>
    </section>
  );
}

type CaseItem = (typeof exemplos)[number];

function CaseMeta({ item }: { item: CaseItem }) {
  return (
    <div className="mt-5 flex flex-col gap-1.5">
      <div className="font-display text-2xl md:text-3xl font-bold text-ink">{item.label}</div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-wider text-gold-deep">
        <span>{item.midia}</span>
        <span className="text-ink-soft/40">·</span>
        <span className="text-teal">{item.ambiente}</span>
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
            src={item.image}
            alt={`Exemplo ilustrativo — ${item.midia}`}
            loading="lazy"
            style={{ objectPosition: item.objectPosition }}
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
            src={item.image}
            alt={`Exemplo ilustrativo — ${item.midia}`}
            loading="lazy"
            style={{ objectPosition: item.objectPosition }}
            className="h-full w-full object-cover"
          />
        </div>
        <CaseMeta item={item} />
      </div>
    </div>
  );
}
