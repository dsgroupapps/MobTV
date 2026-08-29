import { createFileRoute } from "@tanstack/react-router";

import { AdminSystemPage } from "@/components/admin/AdminSystemPage";
import { requireRole } from "@/lib/auth/functions";

export const Route = createFileRoute("/admin/sistema")({
  beforeLoad: () => requireRole({ data: { roles: ["admin"] } }),
  head: () => ({
    meta: [
      { title: "Sistema — Administração MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSystemPage,
});
