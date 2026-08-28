import type { Database } from "@/lib/supabase/database.types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type AssetStatus = Database["public"]["Enums"]["asset_status"];

export type AdvertiserPanel = {
  id: string;
  name: string;
  region: string;
  address?: string;
};

export type AdvertiserAsset = {
  id: string;
  orderItemId: string | null;
  status: AssetStatus;
  type: string;
  width: number;
  height: number;
  durationSeconds: number;
  storagePath: string | null;
  createdAt: string;
  deleteAt: string | null;
  panel: AdvertiserPanel | null;
  date: string | null;
  startTime: string | null;
};

export type AdvertiserOrderItem = {
  id: string;
  panelId: string;
  panel: AdvertiserPanel | null;
  date: string;
  startTime: string;
  durationSeconds: number;
  unitPrice: number;
  finalPrice: number;
  assets: AdvertiserAsset[];
};

export type AdvertiserOrder = {
  id: string;
  quoteId: string | null;
  status: OrderStatus;
  totalAmount: number;
  paidAt: string | null;
  createdAt: string;
  itemCount: number;
  items: AdvertiserOrderItem[];
};

export type AdvertiserOrderDetail = AdvertiserOrder & {
  quote: {
    id: string;
    type: Database["public"]["Enums"]["quote_type"];
    dateStart: string | null;
    dateEnd: string | null;
    durationSeconds: number | null;
    totalInsertions: number | null;
    status: Database["public"]["Enums"]["quote_status"];
    totalPrice: number;
  } | null;
  exhibitions: {
    total: number;
    totalDurationSeconds: number;
    byAsset: Record<string, number>;
  };
};

export type AdvertiserExhibition = {
  id: string;
  assetId: string;
  panelName: string;
  playedAt: string;
  durationSeconds: number;
};

export type AdvertiserCampaignsData = {
  orders: AdvertiserOrder[];
  exhibitions: AdvertiserExhibition[];
};

export type AdvertiserCalendarPanel = Pick<AdvertiserPanel, "id" | "name">;

export type AdvertiserCalendarReservation = {
  id: string;
  panelId: string;
  panelName: string;
  orderId: string;
  date: string;
  startTime: string;
  durationSeconds: number;
};
