import { createFileRoute } from "@tanstack/react-router";

import { AuthenticatedPlaceholder } from "@/components/auth/AuthenticatedPlaceholder";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin")({
  loader: () => requireRole({ data: { roles: ["admin", "operator"] } }),
  head: () => ({
    meta: [
      { title: "Área administrativa — MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const user = Route.useLoaderData();
  return <AuthenticatedPlaceholder user={user} area="administrativa" />;
}
