import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import {
  DashboardLoading,
  DashboardRouteError,
} from "@/components/dashboard/post-purchase/DashboardQueryState";
import { OrdersPage } from "@/components/dashboard/post-purchase/OrdersPage";
import { advertiserOrdersQueryOptions } from "@/lib/advertiser/orders";

export const Route = createFileRoute("/dashboard/pedidos/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(advertiserOrdersQueryOptions(context.advertiserUser.id)),
  head: () => ({
    meta: [
      { title: "Pedidos — Área do anunciante MOBTV" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: () => <DashboardLoading label="Carregando pedidos..." />,
  errorComponent: DashboardRouteError,
  component: OrdersRoute,
});

function OrdersRoute() {
  const { advertiserUser } = Route.useRouteContext();
  const initialData = Route.useLoaderData();
  const { data } = useQuery({
    ...advertiserOrdersQueryOptions(advertiserUser.id),
    initialData,
  });
  return <OrdersPage orders={data} />;
}
