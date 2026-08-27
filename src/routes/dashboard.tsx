import { createFileRoute } from "@tanstack/react-router";

import { AuthenticatedPlaceholder } from "@/components/auth/AuthenticatedPlaceholder";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/dashboard")({
  loader: () => requireRole({ data: { roles: ["advertiser"] } }),
  head: () => ({
    meta: [
      { title: "Área do anunciante — MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const user = Route.useLoaderData();
  return <AuthenticatedPlaceholder user={user} area="anunciante" />;
}
