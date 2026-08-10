import type { Poll, PollOption, Vote } from "./poll";

/**
 * Row shapes as stored in Supabase, typed for `@supabase/supabase-js`. Each
 * table carries an empty `Relationships` tuple (required by the client's
 * `GenericTable` constraint). `poll_secrets` is only ever touched server-side
 * via the service-role client.
 */
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      polls: {
        Row: Poll;
        Insert: Omit<Poll, "id" | "created_at" | "views"> & {
          id?: string;
          created_at?: string;
          views?: number;
        };
        Update: Partial<Poll>;
        Relationships: [];
      };
      poll_options: {
        Row: PollOption;
        Insert: Omit<PollOption, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<PollOption>;
        Relationships: [];
      };
      votes: {
        Row: Vote;
        Insert: Omit<Vote, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Vote>;
        Relationships: [];
      };
      poll_secrets: {
        Row: { poll_id: string; admin_token: string; created_at: string };
        Insert: { poll_id: string; admin_token: string; created_at?: string };
        Update: Partial<{ poll_id: string; admin_token: string }>;
        Relationships: [];
      };
      rate_limits: {
        Row: { id: string; ip_hash: string; action: string; created_at: string };
        Insert: { id?: string; ip_hash: string; action: string; created_at?: string };
        Update: Partial<{ id: string; ip_hash: string; action: string; created_at: string }>;
        Relationships: [];
      };
      poll_comments: {
        Row: {
          id: string;
          poll_id: string;
          user_id: string | null;
          user_name: string;
          user_email: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          user_id: string | null;
          user_name: string;
          user_email: string;
          content: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          poll_id: string;
          user_id: string | null;
          user_name: string;
          user_email: string;
          content: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string | null;
          user_email: string;
          action: string;
          target_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string | null;
          user_email: string;
          action: string;
          target_name: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          workspace_id: string;
          user_id: string | null;
          user_email: string;
          action: string;
          target_name: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          masked_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_hash: string;
          masked_key: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          masked_key: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          name: string;
          slug: string;
          created_by: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          workspace_id: string;
          user_id: string;
          role: string;
          created_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_poll_views: {
        Args: { poll_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
