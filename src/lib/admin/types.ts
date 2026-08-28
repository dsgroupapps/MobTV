import type { AppRole } from "@/lib/auth/types";
import type { CampaignPanel } from "@/lib/campaign/business";
import type { Database } from "@/lib/supabase/database.types";

export type AdminDashboardData = {
  metrics: {
    activePanels: number;
    totalRevenue: number;
    activeCampaigns: number;
    pendingCampaigns: number;
    totalInsertions: number;
    advertisers: number;
    exhibitions: number;
  };
  panelStats: Array<{ panelName: string; count: number }>;
  occupancy: Array<{
    panelId: string;
    panelName: string;
    days: Array<{ date: string; occupancy: number }>;
  }>;
  weekDays: string[];
};

export type AdminUserRow = {
  id: string;
  name: string;
  role: AppRole;
  createdAt: string;
  approvedAssets: number;
  pendingAssets: number;
  recentOrders: Array<{
    id: string;
    status: Database["public"]["Enums"]["order_status"];
    createdAt: string;
  }>;
};

export type AdminUsersData = {
  users: AdminUserRow[];
  stats: {
    totalUsers: number;
    recentCampaigns: number;
    pendingAssets: number;
    approvedAssets: number;
  };
};

export type AdminCampaignUser = { id: string; name: string };
export type AdminCampaignPanel = Pick<CampaignPanel, "id" | "name" | "region">;

export type AdminCampaignFilters = {
  users: AdminCampaignUser[];
  panels: AdminCampaignPanel[];
};

export type AdminCampaignCreationData = {
  users: AdminCampaignUser[];
  panels: CampaignPanel[];
};

export type AdminReservation = {
  id: string;
  panelId: string;
  panelName: string;
  orderId: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  durationSeconds: number;
};

export type AdminTargetUserStats = {
  totalCampaigns: number;
  totalInsertions: number;
  panelStats: Array<{ panelName: string; count: number }>;
};

export type AdminOperationalPanel = {
  id: string;
  name: string;
  region: string;
  address: string;
  timezone: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminPanelFormat = {
  id: string;
  panelId: string;
  panelName: string;
  panelActive: boolean;
  width: number;
  height: number;
  orientation: Database["public"]["Enums"]["panel_orientation"];
  durationsAllowed: number[];
  createdAt: string;
};

export type AdminPanelHour = {
  id: string;
  panelId: string;
  panelName: string;
  panelActive: boolean;
  weekday: number;
  startTime: string;
  endTime: string;
  createdAt: string;
};

export type AdminPanelHourException = {
  id: string;
  panelId: string;
  panelName: string;
  panelActive: boolean;
  date: string;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
};

export type AdminPanelHoursData = {
  panels: AdminOperationalPanel[];
  formats: AdminPanelFormat[];
  hours: AdminPanelHour[];
  exceptions: AdminPanelHourException[];
  futureReservations: Array<{ panelId: string; durationSeconds: number }>;
};

export type AdminPricingRule = {
  id: string;
  panelId: string;
  panelName: string;
  panelActive: boolean;
  weekday: number | null;
  timeStart: string | null;
  timeEnd: string | null;
  durationSeconds: number;
  basePrice: number;
  discountPct: number | null;
  dateStart: string | null;
  dateEnd: string | null;
  createdAt: string;
};

export type AdminPanelBlackout = {
  id: string;
  panelId: string;
  panelName: string;
  panelActive: boolean;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  createdAt: string;
};

export type AdminModerationAsset = {
  id: string;
  orderItemId: string | null;
  advertiserName: string;
  panelName: string;
  panelRegion: string;
  type: string;
  width: number;
  height: number;
  durationSeconds: number;
  storagePath: string | null;
  createdAt: string;
};

export type AdminModerationLog = {
  id: string;
  assetId: string;
  reviewerName: string;
  action: "approved" | "rejected" | string;
  reason: string | null;
  createdAt: string;
};

export type AdminModerationData = {
  pendingAssets: AdminModerationAsset[];
  recentLogs: AdminModerationLog[];
};

export type AdminPlayerPanel = {
  id: string;
  name: string;
  region: string;
  address: string;
  active: boolean;
};

export type AdminAnalyticsOrder = {
  id: string;
  userName: string;
  createdAt: string;
  itemCount: number;
  status: Database["public"]["Enums"]["order_status"];
  totalAmount: number;
};

export type AdminAnalyticsClient = {
  userId: string;
  userName: string;
  exhibitions: number;
  panelCount: number;
};

export type AdminOppLog = {
  id: string;
  advertiserName: string;
  panelName: string;
  panelRegion: string;
  playedAt: string;
  durationSeconds: number;
  status: Database["public"]["Enums"]["opp_status"];
};

export type AdminAnalyticsData = {
  metrics: {
    totalRevenue: number;
    paidOrders: number;
    totalExhibitions: number;
    uniqueAdvertisers: number;
  };
  orders: AdminAnalyticsOrder[];
  clients: AdminAnalyticsClient[];
  recentOppLogs: AdminOppLog[];
  recentLogLimit: number;
};
