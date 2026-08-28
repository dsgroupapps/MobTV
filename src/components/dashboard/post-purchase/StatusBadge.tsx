import { Badge } from "@/components/ui/badge";
import type { AssetStatus, OrderStatus } from "@/lib/advertiser/types";
import { cn } from "@/lib/utils";

const orderStatuses: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "border-gold/35 bg-gold/12 text-gold-deep" },
  paid: { label: "Pago", className: "border-teal/35 bg-teal/12 text-navy" },
  released: { label: "Liberado", className: "border-teal/35 bg-teal/12 text-navy" },
  cancelled: { label: "Cancelado", className: "border-red/30 bg-red/8 text-red" },
};

const assetStatuses: Record<AssetStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "border-gold/35 bg-gold/12 text-gold-deep" },
  approved: { label: "Aprovada", className: "border-teal/35 bg-teal/12 text-navy" },
  rejected: { label: "Rejeitada", className: "border-red/30 bg-red/8 text-red" },
};

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <Badge variant="outline" className={cn("shrink-0 font-medium shadow-none", className)}>
      {label}
    </Badge>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <StatusBadge {...orderStatuses[status]} />;
}

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return <StatusBadge {...assetStatuses[status]} />;
}
