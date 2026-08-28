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
