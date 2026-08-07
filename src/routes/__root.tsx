import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

// Arcos de sinal — mesmo motivo usado em Hero.tsx, reduzido para uma versão
// discreta de fundo nas telas utilitárias (404 / erro).
function SignalArcs() {
  const arcs = [
    { r: 150, color: "#F2B705", opacity: 0.22, delay: 0 },
    { r: 280, color: "#2DD4BF", opacity: 0.16, delay: 1 },
    { r: 420, color: "#F2B705", opacity: 0.1, delay: 2 },
  ];
  const arcFraction = 140 / 360;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ overflow: "visible" }}
    >
      {arcs.map((a, i) => {
        const circ = 2 * Math.PI * a.r;
        const arcLen = circ * arcFraction;
        return (
          <circle
            key={i}
            cx="95%"
            cy="-5%"
            r={a.r}
            fill="none"
            stroke={a.color}
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeDasharray={`${arcLen} ${circ - arcLen}`}
            strokeDashoffset={-circ * 0.25}
            strokeOpacity={a.opacity}
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              animation: `signal-pulse 7s ease-in-out ${a.delay}s infinite`,
            }}
          />
        );
      })}
    </svg>
  );
}

function UtilityPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-6 text-off-white">
      <SignalArcs />
      <div className="relative z-10 max-w-md text-center">{children}</div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <UtilityPageShell>
      <div className="font-mono text-sm tracking-widest text-gold">/ ERRO 404</div>
      <h1 className="mt-4 font-display text-7xl font-bold text-white">404</h1>
      <h2 className="mt-4 font-display text-xl font-semibold text-off-white">
        Página não encontrada
      </h2>
      <p className="mt-2 text-sm text-off-white/70">
        A página que você procura não existe ou foi movida.
      </p>
      <div className="mt-8">
        <Link to="/" className="btn-primary">
          Voltar para a Home
        </Link>
      </div>
    </UtilityPageShell>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <UtilityPageShell>
      <div className="font-mono text-sm tracking-widest text-gold">/ ERRO</div>
      <h1 className="mt-4 font-display text-xl font-semibold text-white">
        Essa página não carregou
      </h1>
      <p className="mt-2 text-sm text-off-white/70">
        Algo deu errado do nosso lado. Você pode tentar novamente ou voltar para o início.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="btn-primary"
        >
          Tentar novamente
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center bg-transparent text-gold border border-gold rounded-lg px-6 py-3 font-semibold transition-colors hover:bg-gold hover:text-navy"
        >
          Voltar ao início
        </a>
      </div>
    </UtilityPageShell>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MOBTV — Mídia DOOH + WiFi Ads no Distrito Federal" },
      { name: "description", content: "Rede de mídia DOOH e WiFi Ads no Distrito Federal." },
      { name: "author", content: "MOBTV" },
      { property: "og:title", content: "MOBTV — Mídia DOOH + WiFi Ads no Distrito Federal" },
      { property: "og:description", content: "Rede de mídia DOOH e WiFi Ads no Distrito Federal." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:image", content: "/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "MOBTV — Mídia DOOH + WiFi Ads no Distrito Federal" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MOBTV — Mídia DOOH + WiFi Ads no Distrito Federal" },
      {
        name: "twitter:description",
        content: "Rede de mídia DOOH e WiFi Ads no Distrito Federal.",
      },
      { name: "twitter:image", content: "/og-image.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-192.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
