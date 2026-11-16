// Generated from the local migrations by introspecting PostgreSQL.
// Regenerate against a live project with:
//   npx supabase gen types typescript --local > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string;
          value: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          target_type: string;
          target_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: never;
          actor_id?: string | null;
          action: string;
          target_type: string;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: number;
          actor_id?: string | null;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      connections: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: Database["public"]["Enums"]["connection_status"];
          note: string | null;
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: Database["public"]["Enums"]["connection_status"];
          note?: string | null;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: Database["public"]["Enums"]["connection_status"];
          note?: string | null;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          user_id: string;
          last_read_at: string | null;
          joined_at: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          last_read_at?: string | null;
          joined_at?: string;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          last_read_at?: string | null;
          joined_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          pair_key: string;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pair_key: string;
          last_message_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pair_key?: string;
          last_message_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      data_export_requests: {
        Row: {
          id: string;
          user_id: string;
          status: Database["public"]["Enums"]["data_request_status"];
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: Database["public"]["Enums"]["data_request_status"];
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: Database["public"]["Enums"]["data_request_status"];
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          sport_id: string;
          proposed_date: string;
          proposed_time: string;
          location_note: string;
          message: string | null;
          status: Database["public"]["Enums"]["invitation_status"];
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          sport_id: string;
          proposed_date: string;
          proposed_time: string;
          location_note: string;
          message?: string | null;
          status?: Database["public"]["Enums"]["invitation_status"];
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          sport_id?: string;
          proposed_date?: string;
          proposed_time?: string;
          location_note?: string;
          message?: string | null;
          status?: Database["public"]["Enums"]["invitation_status"];
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      member_availability: {
        Row: {
          user_id: string;
          day_of_week: number;
          time_block: Database["public"]["Enums"]["time_block"];
        };
        Insert: {
          user_id: string;
          day_of_week: number;
          time_block: Database["public"]["Enums"]["time_block"];
        };
        Update: {
          user_id?: string;
          day_of_week?: number;
          time_block?: Database["public"]["Enums"]["time_block"];
        };
        Relationships: [];
      };
      member_profiles: {
        Row: {
          user_id: string;
          first_name: string;
          last_name: string | null;
          show_last_name: boolean;
          bio: string | null;
          neighborhood: string;
          occupation: string | null;
          show_occupation: boolean;
          photo_path: string | null;
          visibility: Database["public"]["Enums"]["profile_visibility"];
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          first_name: string;
          last_name?: string | null;
          show_last_name?: boolean;
          bio?: string | null;
          neighborhood: string;
          occupation?: string | null;
          show_occupation?: boolean;
          photo_path?: string | null;
          visibility?: Database["public"]["Enums"]["profile_visibility"];
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          first_name?: string;
          last_name?: string | null;
          show_last_name?: boolean;
          bio?: string | null;
          neighborhood?: string;
          occupation?: string | null;
          show_occupation?: boolean;
          photo_path?: string | null;
          visibility?: Database["public"]["Enums"]["profile_visibility"];
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      member_sports: {
        Row: {
          user_id: string;
          sport_id: string;
          skill_level: string;
          formats: string[];
          created_at: string;
        };
        Insert: {
          user_id: string;
          sport_id: string;
          skill_level: string;
          formats?: string[];
          created_at?: string;
        };
        Update: {
          user_id?: string;
          sport_id?: string;
          skill_level?: string;
          formats?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      membership_applications: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          full_name: string;
          date_of_birth: string;
          neighborhood: string;
          occupation: string | null;
          sports: Json;
          availability: Json;
          introduction: string;
          motivation: string;
          referral_code_id: string | null;
          photo_path: string | null;
          status: Database["public"]["Enums"]["application_status"];
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          full_name: string;
          date_of_birth: string;
          neighborhood: string;
          occupation?: string | null;
          sports?: Json;
          availability?: Json;
          introduction: string;
          motivation: string;
          referral_code_id?: string | null;
          photo_path?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string;
          full_name?: string;
          date_of_birth?: string;
          neighborhood?: string;
          occupation?: string | null;
          sports?: Json;
          availability?: Json;
          introduction?: string;
          motivation?: string;
          referral_code_id?: string | null;
          photo_path?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          key: string;
          window_start: string;
          hits: number;
        };
        Insert: {
          key: string;
          window_start: string;
          hits?: number;
        };
        Update: {
          key?: string;
          window_start?: string;
          hits?: number;
        };
        Relationships: [];
      };
      referral_codes: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          owner_id: string | null;
          created_by: string | null;
          max_uses: number | null;
          use_count: number;
          is_active: boolean;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          owner_id?: string | null;
          created_by?: string | null;
          max_uses?: number | null;
          use_count?: number;
          is_active?: boolean;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string | null;
          owner_id?: string | null;
          created_by?: string | null;
          max_uses?: number | null;
          use_count?: number;
          is_active?: boolean;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string | null;
          reported_user_id: string | null;
          message_id: string | null;
          invitation_id: string | null;
          reason: Database["public"]["Enums"]["report_reason"];
          details: string | null;
          status: Database["public"]["Enums"]["report_status"];
          reviewed_by: string | null;
          resolution_note: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id?: string | null;
          reported_user_id?: string | null;
          message_id?: string | null;
          invitation_id?: string | null;
          reason: Database["public"]["Enums"]["report_reason"];
          details?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          reviewed_by?: string | null;
          resolution_note?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string | null;
          reported_user_id?: string | null;
          message_id?: string | null;
          invitation_id?: string | null;
          reason?: Database["public"]["Enums"]["report_reason"];
          details?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          reviewed_by?: string | null;
          resolution_note?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sports: {
        Row: {
          id: string;
          slug: string;
          name: string;
          skill_levels: string[];
          formats: string[];
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          skill_levels: string[];
          formats: string[];
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          skill_levels?: string[];
          formats?: string[];
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stripe_events: {
        Row: {
          id: string;
          type: string;
          received_at: string;
        };
        Insert: {
          id: string;
          type: string;
          received_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          received_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          unit_amount: number | null;
          currency: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          ended_at: string | null;
          stripe_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          stripe_price_id?: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          unit_amount?: number | null;
          currency?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          ended_at?: string | null;
          stripe_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          stripe_price_id?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          unit_amount?: number | null;
          currency?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          ended_at?: string | null;
          stripe_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          role: Database["public"]["Enums"]["user_role"];
          account_status: Database["public"]["Enums"]["account_status"];
          suspended_reason: string | null;
          stripe_customer_id: string | null;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: Database["public"]["Enums"]["user_role"];
          account_status?: Database["public"]["Enums"]["account_status"];
          suspended_reason?: string | null;
          stripe_customer_id?: string | null;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: Database["public"]["Enums"]["user_role"];
          account_status?: Database["public"]["Enums"]["account_status"];
          suspended_reason?: string | null;
          stripe_customer_id?: string | null;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      are_connected: { Args: { a: string; b: string }; Returns: boolean };
      can_message: { Args: { cid: string; uid?: string }; Returns: boolean };
      can_use_community: { Args: { uid?: string }; Returns: boolean };
      can_view_member: { Args: { viewer: string; target: string }; Returns: boolean };
      consume_referral_code: { Args: { p_code: string }; Returns: string | null };
      get_or_create_conversation: { Args: { other: string }; Returns: string };
      is_active_member: { Args: { uid?: string }; Returns: boolean };
      is_admin: { Args: { uid?: string }; Returns: boolean };
      is_blocked_between: { Args: { a: string; b: string }; Returns: boolean };
      is_conversation_participant: { Args: { cid: string; uid?: string }; Returns: boolean };
      my_unread_counts: { Args: Record<PropertyKey, never>; Returns: { conversation_id: string; unread: number }[] };
      rate_limit_hit: { Args: { p_key: string; p_limit: number; p_window_seconds: number }; Returns: boolean };
    };
    Enums: {
      account_status: "ACTIVE" | "SUSPENDED";
      application_status: "PENDING" | "APPROVED" | "REJECTED" | "WAITLISTED";
      connection_status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
      data_request_status: "PENDING" | "COMPLETED";
      invitation_status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "COMPLETED";
      profile_visibility: "MEMBERS" | "CONNECTIONS" | "HIDDEN";
      report_reason: "HARASSMENT" | "INAPPROPRIATE_CONTENT" | "SAFETY_CONCERN" | "SPAM" | "FAKE_PROFILE" | "NO_SHOW" | "OTHER";
      report_status: "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED";
      subscription_status: "incomplete" | "incomplete_expired" | "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "paused";
      time_block: "EARLY_MORNING" | "MORNING" | "MIDDAY" | "AFTERNOON" | "EVENING";
      user_role: "ADMIN" | "MEMBER" | "APPLICANT";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
