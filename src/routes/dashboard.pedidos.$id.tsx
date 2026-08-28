import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { OrderDetailsPage } from "@/components/dashboard/post-purchase/OrderDetailsPage";
import { advertiserOrderDetailQueryOptions } from "@/lib/advertiser/orders";

export const Route = createFileRoute("/dashboard/pedidos/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      advertiserOrderDetailQueryOptions(context.advertiserUser.id, params.id),
    ),
  head: () => ({
    meta: [
      { title: "Detalhe do pedido — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando ordem de serviço..." />,
  errorComponent: DashboardRouteError,
  component: OrderDetailRoute,
});

function OrderDetailRoute() {
  const { advertiserUser } = Route.useRouteContext();
  const { id } = Route.useParams();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({
    ...advertiserOrderDetailQueryOptions(advertiserUser.id, id),
    initialData,
  });
  return <OrderDetailsPage order={data} />;
}
