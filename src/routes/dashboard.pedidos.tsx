import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";

import { DashboardPlaceholder } from "@/components/dashboard/DashboardPlaceholder";

export const Route = createFileRoute("/dashboard/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <DashboardPlaceholder
      icon={ShoppingBag}
      eyebrow="Pedidos"
      title="Pedidos"
      description="A consulta completa dos pedidos e de seus itens será disponibilizada aqui sem alterar o histórico existente."
    />
  );
}
