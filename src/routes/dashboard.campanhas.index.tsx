import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";

import { DashboardPlaceholder } from "@/components/dashboard/DashboardPlaceholder";

export const Route = createFileRoute("/dashboard/campanhas/")({
  head: () => ({
    meta: [
      { title: "Campanhas — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  return (
    <DashboardPlaceholder
      icon={Megaphone}
      eyebrow="Campanhas"
      title="Campanhas"
      description="A gestão detalhada das suas campanhas será incorporada nesta área na próxima etapa da integração."
    />
  );
}
