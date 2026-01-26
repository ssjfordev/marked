export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      folders: {
        Row: {
          id: string;
          short_id: string;
          user_id: string;
          name: string;
          icon: string | null;
          description: string | null;
          parent_id: string | null;
          position: number;
          share_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          short_id?: string;
          user_id: string;
          name: string;
          icon?: string | null;
          description?: string | null;
          parent_id?: string | null;
          position?: number;
          share_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          short_id?: string;
          user_id?: string;
          name?: string;
          icon?: string | null;
          description?: string | null;
          parent_id?: string | null;
          position?: number;
          share_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      link_canonicals: {
        Row: {
          id: string;
          short_id: string;
          url_key: string;
          original_url: string;
          domain: string;
          title: string | null;
          description: string | null;
          og_image: string | null;
          favicon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          short_id?: string;
          url_key: string;
          original_url: string;
          domain: string;
          title?: string | null;
          description?: string | null;
          og_image?: string | null;
          favicon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          short_id?: string;
          url_key?: string;
          original_url?: string;
          domain?: string;
          title?: string | null;
          description?: string | null;
          og_image?: string | null;
          favicon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      link_instances: {
        Row: {
          id: string;
          user_id: string;
          link_canonical_id: string;
          folder_id: string;
          user_title: string | null;
          user_description: string | null;
          position: number;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          link_canonical_id: string;
          folder_id: string;
          user_title?: string | null;
          user_description?: string | null;
          position?: number;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          link_canonical_id?: string;
          folder_id?: string;
          user_title?: string | null;
          user_description?: string | null;
          position?: number;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      link_tags: {
        Row: {
          link_instance_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          link_instance_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          link_instance_id?: string;
          tag_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      marks: {
        Row: {
          id: string;
          user_id: string;
          link_canonical_id: string;
          text: string;
          color: string;
          note: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          link_canonical_id: string;
          text: string;
          color?: string;
          note?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          link_canonical_id?: string;
          text?: string;
          color?: string;
          note?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      memos: {
        Row: {
          id: string;
          user_id: string;
          link_canonical_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          link_canonical_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          link_canonical_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: 'free' | 'pro' | 'ai_pro';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: 'active' | 'canceled' | 'past_due' | 'trialing';
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: 'free' | 'pro' | 'ai_pro';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: 'active' | 'canceled' | 'past_due' | 'trialing';
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: 'free' | 'pro' | 'ai_pro';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: 'active' | 'canceled' | 'past_due' | 'trialing';
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      import_jobs: {
        Row: {
          id: string;
          user_id: string;
          source_type: 'chrome_html' | 'firefox_html' | 'safari_html' | 'edge_html' | 'raindrop_html' | 'raindrop_csv' | 'csv';
          status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
          total_items: number;
          processed_items: number;
          failed_items: number;
          last_error: string | null;
          created_at: string;
          started_at: string | null;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_type?: 'chrome_html' | 'firefox_html' | 'safari_html' | 'edge_html' | 'raindrop_html' | 'raindrop_csv' | 'csv';
          status?: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
          total_items?: number;
          processed_items?: number;
          failed_items?: number;
          last_error?: string | null;
          created_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_type?: 'chrome_html' | 'firefox_html' | 'safari_html' | 'edge_html' | 'raindrop_html' | 'raindrop_csv' | 'csv';
          status?: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
          total_items?: number;
          processed_items?: number;
          failed_items?: number;
          last_error?: string | null;
          created_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Relationships: [];
      };
      enrichment_jobs: {
        Row: {
          id: string;
          link_canonical_id: string;
          status: 'queued' | 'running' | 'succeeded' | 'failed' | 'dead';
          attempts: number;
          max_attempts: number;
          run_after: string;
          locked_at: string | null;
          locked_by: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          link_canonical_id: string;
          status?: 'queued' | 'running' | 'succeeded' | 'failed' | 'dead';
          attempts?: number;
          max_attempts?: number;
          run_after?: string;
          locked_at?: string | null;
          locked_by?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          link_canonical_id?: string;
          status?: 'queued' | 'running' | 'succeeded' | 'failed' | 'dead';
          attempts?: number;
          max_attempts?: number;
          run_after?: string;
          locked_at?: string | null;
          locked_by?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      plan_type: 'free' | 'pro' | 'ai_pro';
      subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing';
      import_job_status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
      enrichment_job_status: 'queued' | 'running' | 'succeeded' | 'failed' | 'dead';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for table access
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
