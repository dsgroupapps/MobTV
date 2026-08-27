export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      assets: {
        Row: {
          checksum: string | null;
          created_at: string;
          delete_at: string | null;
          duration_seconds: number;
          height: number;
          id: string;
          order_item_id: string | null;
          status: Database["public"]["Enums"]["asset_status"];
          storage_url: string | null;
          type: string;
          user_id: string;
          width: number;
        };
        Insert: {
          checksum?: string | null;
          created_at?: string;
          delete_at?: string | null;
          duration_seconds: number;
          height: number;
          id?: string;
          order_item_id?: string | null;
          status?: Database["public"]["Enums"]["asset_status"];
          storage_url?: string | null;
          type: string;
          user_id: string;
          width: number;
        };
        Update: {
          checksum?: string | null;
          created_at?: string;
          delete_at?: string | null;
          duration_seconds?: number;
          height?: number;
          id?: string;
          order_item_id?: string | null;
          status?: Database["public"]["Enums"]["asset_status"];
          storage_url?: string | null;
          type?: string;
          user_id?: string;
          width?: number;
        };
        Relationships: [
          {
            foreignKeyName: "assets_order_item_id_fkey";
            columns: ["order_item_id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          after: Json | null;
          before: Json | null;
          created_at: string;
          entity: string;
          entity_id: string;
          id: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          entity: string;
          entity_id: string;
          id?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          entity?: string;
          entity_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      filler_media: {
        Row: {
          active: boolean;
          created_at: string;
          duration_seconds: number;
          height: number;
          id: string;
          name: string;
          panel_ids: string[] | null;
          storage_url: string;
          type: string;
          updated_at: string;
          width: number;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          duration_seconds: number;
          height: number;
          id?: string;
          name: string;
          panel_ids?: string[] | null;
          storage_url: string;
          type: string;
          updated_at?: string;
          width: number;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          duration_seconds?: number;
          height?: number;
          id?: string;
          name?: string;
          panel_ids?: string[] | null;
          storage_url?: string;
          type?: string;
          updated_at?: string;
          width?: number;
        };
        Relationships: [];
      };
      moderation_logs: {
        Row: {
          action: string;
          asset_id: string;
          created_at: string;
          id: string;
          reason: string | null;
          reviewer_id: string;
        };
        Insert: {
          action: string;
          asset_id: string;
          created_at?: string;
          id?: string;
          reason?: string | null;
          reviewer_id: string;
        };
        Update: {
          action?: string;
          asset_id?: string;
          created_at?: string;
          id?: string;
          reason?: string | null;
          reviewer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_logs_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
      };
      opp_logs: {
        Row: {
          asset_id: string;
          created_at: string;
          duration_seconds: number;
          id: string;
          latency_ms: number | null;
          panel_id: string;
          played_at: string;
          player_agent: string | null;
          proof_hash: string | null;
          status: Database["public"]["Enums"]["opp_status"];
        };
        Insert: {
          asset_id: string;
          created_at?: string;
          duration_seconds: number;
          id?: string;
          latency_ms?: number | null;
          panel_id: string;
          played_at: string;
          player_agent?: string | null;
          proof_hash?: string | null;
          status: Database["public"]["Enums"]["opp_status"];
        };
        Update: {
          asset_id?: string;
          created_at?: string;
          duration_seconds?: number;
          id?: string;
          latency_ms?: number | null;
          panel_id?: string;
          played_at?: string;
          player_agent?: string | null;
          proof_hash?: string | null;
          status?: Database["public"]["Enums"]["opp_status"];
        };
        Relationships: [
          {
            foreignKeyName: "opp_logs_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opp_logs_panel_id_fkey";
            columns: ["panel_id"];
            isOneToOne: false;
            referencedRelation: "panels";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          date: string;
          duration_seconds: number;
          final_price: number;
          id: string;
          order_id: string;
          panel_id: string;
          start_time: string;
          unit_price: number;
        };
        Insert: {
          created_at?: string;
          date: string;
          duration_seconds: number;
          final_price: number;
          id?: string;
          order_id: string;
          panel_id: string;
          start_time: string;
          unit_price: number;
        };
        Update: {
          created_at?: string;
          date?: string;
          duration_seconds?: number;
          final_price?: number;
          id?: string;
          order_id?: string;
          panel_id?: string;
          start_time?: string;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_panel_id_fkey";
            columns: ["panel_id"];
            isOneToOne: false;
            referencedRelation: "panels";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string;
          id: string;
          paid_at: string | null;
          quote_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total_amount: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          paid_at?: string | null;
          quote_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total_amount: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          paid_at?: string | null;
          quote_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total_amount?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      panel_blackouts: {
        Row: {
          created_at: string;
          date: string;
          end_time: string;
          id: string;
          panel_id: string;
          reason: string | null;
          start_time: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          end_time: string;
          id?: string;
          panel_id: string;
          reason?: string | null;
          start_time: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          end_time?: string;
          id?: string;
          panel_id?: string;
          reason?: string | null;
          start_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: "panel_blackouts_panel_id_fkey";
            columns: ["panel_id"];
            isOneToOne: false;
            referencedRelation: "panels";
            referencedColumns: ["id"];
          },
        ];
      };
      panel_formats: {
        Row: {
          created_at: string;
          durations_allowed: number[];
          height: number;
          id: string;
          orientation: Database["public"]["Enums"]["panel_orientation"];
          panel_id: string;
          width: number;
        };
        Insert: {
          created_at?: string;
          durations_allowed?: number[];
          height: number;
          id?: string;
          orientation: Database["public"]["Enums"]["panel_orientation"];
          panel_id: string;
          width: number;
        };
        Update: {
          created_at?: string;
          durations_allowed?: number[];
          height?: number;
          id?: string;
          orientation?: Database["public"]["Enums"]["panel_orientation"];
          panel_id?: string;
          width?: number;
        };
        Relationships: [
          {
            foreignKeyName: "panel_formats_panel_id_fkey";
            columns: ["panel_id"];
            isOneToOne: false;
            referencedRelation: "panels";
            referencedColumns: ["id"];
          },
        ];
      };
      panel_hour_exceptions: {
        Row: {
          created_at: string;
          date: string;
          end_time: string | null;
          id: string;
          panel_id: string;
          start_time: string | null;
        };
        Insert: {
          created_at?: string;
          date: string;
          end_time?: string | null;
          id?: string;
          panel_id: string;
          start_time?: string | null;
        };
        Update: {
          created_at?: string;
          date?: string;
          end_time?: string | null;
          id?: string;
          panel_id?: string;
          start_time?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "panel_hour_exceptions_panel_id_fkey";
            columns: ["panel_id"];
            isOneToOne: false;
            referencedRelation: "panels";
            referencedColumns: ["id"];
          },
        ];
      };
      panel_hours: {
        Row: {
          created_at: string;
          end_time: string;
          id: string;
          panel_id: string;
          start_time: string;
          weekday: number;
        };
        Insert: {
          created_at?: string;
          end_time: string;
          id?: string;
          panel_id: string;
          start_time: string;
          weekday: number;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          id?: string;
          panel_id?: string;
          start_time?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "panel_hours_panel_id_fkey";
            columns: ["panel_id"];
            isOneToOne: false;
            referencedRelation: "panels";
            referencedColumns: ["id"];
          },
        ];
      };
      panels: {
        Row: {
          active: boolean;
          address: string;
          created_at: string;
          id: string;
          location: unknown | null;
          name: string;
          region: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          address: string;
          created_at?: string;
          id?: string;
          location?: unknown | null;
          name: string;
          region: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          address?: string;
          created_at?: string;
          id?: string;
          location?: unknown | null;
          name?: string;
          region?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pricing_rules: {
        Row: {
          base_price: number;
          created_at: string;
          date_end: string | null;
          date_start: string | null;
          discount_pct: number | null;
          duration_seconds: number;
          id: string;
          panel_id: string;
          time_end: string | null;
          time_start: string | null;
          weekday: number | null;
        };
        Insert: {
          base_price: number;
          created_at?: string;
          date_end?: string | null;
          date_start?: string | null;
          discount_pct?: number | null;
          duration_seconds: number;
          id?: string;
          panel_id: string;
          time_end?: string | null;
          time_start?: string | null;
          weekday?: number | null;
        };
        Update: {
          base_price?: number;
          created_at?: string;
          date_end?: string | null;
          date_start?: string | null;
          discount_pct?: number | null;
          duration_seconds?: number;
          id?: string;
          panel_id?: string;
          time_end?: string | null;
          time_start?: string | null;
          weekday?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "pricing_rules_panel_id_fkey";
            columns: ["panel_id"];
            isOneToOne: false;
            referencedRelation: "panels";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quote_items: {
        Row: {
          created_at: string;
          date: string;
          duration_seconds: number;
          final_price: number;
          id: string;
          panel_id: string;
          quote_id: string;
          start_time: string;
          unit_price: number;
        };
        Insert: {
          created_at?: string;
          date: string;
          duration_seconds: number;
          final_price: number;
          id?: string;
          panel_id: string;
          quote_id: string;
          start_time: string;
          unit_price: number;
        };
        Update: {
          created_at?: string;
          date?: string;
          duration_seconds?: number;
          final_price?: number;
          id?: string;
          panel_id?: string;
          quote_id?: string;
          start_time?: string;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quote_items_panel_id_fkey";
            columns: ["panel_id"];
            isOneToOne: false;
            referencedRelation: "panels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      quotes: {
        Row: {
          created_at: string;
          date_end: string | null;
          date_start: string | null;
          duration_seconds: number | null;
          expires_at: string;
          id: string;
          status: Database["public"]["Enums"]["quote_status"];
          total_insertions: number | null;
          total_price: number;
          type: Database["public"]["Enums"]["quote_type"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date_end?: string | null;
          date_start?: string | null;
          duration_seconds?: number | null;
          expires_at: string;
          id?: string;
          status?: Database["public"]["Enums"]["quote_status"];
          total_insertions?: number | null;
          total_price: number;
          type: Database["public"]["Enums"]["quote_type"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          date_end?: string | null;
          date_start?: string | null;
          duration_seconds?: number | null;
          expires_at?: string;
          id?: string;
          status?: Database["public"]["Enums"]["quote_status"];
          total_insertions?: number | null;
          total_price?: number;
          type?: Database["public"]["Enums"]["quote_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          created_at: string;
          date: string;
          duration_seconds: number;
          id: string;
          order_id: string;
          panel_id: string;
          start_time: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          duration_seconds: number;
          id?: string;
          order_id: string;
          panel_id: string;
          start_time: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          duration_seconds?: number;
          id?: string;
          order_id?: string;
          panel_id?: string;
          start_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_panel_id_fkey";
            columns: ["panel_id"];
            isOneToOne: false;
            referencedRelation: "panels";
            referencedColumns: ["id"];
          },
        ];
      };
      schedules: {
        Row: {
          checksum: string | null;
          date: string;
          id: string;
          manifest_url: string | null;
          panel_id: string;
          published_at: string;
        };
        Insert: {
          checksum?: string | null;
          date: string;
          id?: string;
          manifest_url?: string | null;
          panel_id: string;
          published_at?: string;
        };
        Update: {
          checksum?: string | null;
          date?: string;
          id?: string;
          manifest_url?: string | null;
          panel_id?: string;
          published_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedules_panel_id_fkey";
            columns: ["panel_id"];
            isOneToOne: false;
            referencedRelation: "panels";
            referencedColumns: ["id"];
          },
        ];
      };
      slot_locks: {
        Row: {
          created_at: string;
          date: string;
          duration_seconds: number;
          expires_at: string;
          id: string;
          panel_id: string;
          quote_id: string;
          start_time: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          duration_seconds: number;
          expires_at: string;
          id?: string;
          panel_id: string;
          quote_id: string;
          start_time: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          duration_seconds?: number;
          expires_at?: string;
          id?: string;
          panel_id?: string;
          quote_id?: string;
          start_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: "slot_locks_panel_id_fkey";
            columns: ["panel_id"];
            isOneToOne: false;
            referencedRelation: "panels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "slot_locks_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "operator" | "advertiser";
      asset_status: "pending" | "approved" | "rejected";
      campaign_status: "draft" | "pending" | "active" | "completed" | "cancelled";
      opp_status: "success" | "fail";
      order_status: "pending" | "paid" | "released" | "cancelled";
      panel_orientation: "vertical" | "horizontal" | "ribbon";
      quote_status: "pending" | "expired" | "accepted" | "cancelled";
      quote_type: "campaign" | "space";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "operator", "advertiser"],
      asset_status: ["pending", "approved", "rejected"],
      campaign_status: ["draft", "pending", "active", "completed", "cancelled"],
      opp_status: ["success", "fail"],
      order_status: ["pending", "paid", "released", "cancelled"],
      panel_orientation: ["vertical", "horizontal", "ribbon"],
      quote_status: ["pending", "expired", "accepted", "cancelled"],
      quote_type: ["campaign", "space"],
    },
  },
} as const;
