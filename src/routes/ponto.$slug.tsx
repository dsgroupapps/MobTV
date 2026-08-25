import { createFileRoute, notFound } from "@tanstack/react-router";
import { findPointBySlug } from "@/lib/point-slug";
import { getPointInsights } from "@/data/point-insights";
import { PointProfile } from "@/components/site/PointProfile";

/**
 * Página de perfil de ponto — destino dos QR Codes físicos instalados nos
 * ativos (/ponto/$slug?src=qr&asset=tela-01). Rota ADITIVA e ISOLADA:
 * nenhuma navegação institucional aponta para ela (sem link no Header, sem
 * card no site) — o acesso principal é o QR Code. Por isso também leva
 * `noindex, nofollow` e não entra em nenhum sitemap.
 */
type PontoSearch = {
  src?: string;
  asset?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

function readStringParam(search: Record<string, unknown>, key: string): string | undefined {
  const value = search[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export const Route = createFileRoute("/ponto/$slug")({
  validateSearch: (search: Record<string, unknown>): PontoSearch => ({
    src: readStringParam(search, "src"),
    asset: readStringParam(search, "asset"),
    utm_source: readStringParam(search, "utm_source"),
    utm_medium: readStringParam(search, "utm_medium"),
    utm_campaign: readStringParam(search, "utm_campaign"),
    utm_term: readStringParam(search, "utm_term"),
    utm_content: readStringParam(search, "utm_content"),
  }),
  loader: ({ params }) => {
    const found = findPointBySlug(params.slug);
    if (!found) throw notFound();
    return found;
  },
  head: ({ params }) => {
    const found = findPointBySlug(params.slug);
    const pointName = found?.point.nome ?? "Ponto";
    return {
      meta: [
        { title: `${pointName} — MOBTV Insights` },
        {
          name: "description",
          content: `Perfil de mídia e audiência do ponto ${pointName} — rede MOBTV.`,
        },
        // Página de destino de QR Code, não institucional — nunca indexar.
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  component: PontoPage,
});

function PontoPage() {
  const { point, category } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const insights = getPointInsights(slug);

  const utm = {
    utm_source: search.utm_source,
    utm_medium: search.utm_medium,
    utm_campaign: search.utm_campaign,
    utm_term: search.utm_term,
    utm_content: search.utm_content,
  };
  const hasUtm = Object.values(utm).some((v) => v != null);

  return (
    <PointProfile
      slug={slug}
      point={point}
      category={category}
      insights={insights}
      assetId={search.asset}
      source={search.src}
      utm={hasUtm ? utm : undefined}
    />
  );
}
