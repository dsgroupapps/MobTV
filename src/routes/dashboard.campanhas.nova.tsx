import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { DashboardPlaceholder } from "@/components/dashboard/DashboardPlaceholder";

export const Route = createFileRoute("/dashboard/campanhas/nova")({
  head: () => ({
    meta: [
      { title: "Criar campanha — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CreateCampaignPage,
});

function CreateCampaignPage() {
  return (
    <DashboardPlaceholder
      icon={Plus}
      eyebrow="Campanhas"
      title="Criar campanha"
      description="O fluxo de criação de campanha será conectado ao inventário e às regras comerciais em uma etapa dedicada."
    />
  );
}
