export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      merchant_accounts: {
        Row: {
          id: string
          user_id: string
          merchant_id: string
          account_name: string | null
          google_email: string | null
          access_token_encrypted: string
          refresh_token_encrypted: string
          token_expires_at: string
          scopes: string[]
          is_active: boolean
          last_sync_at: string | null
          last_sync_status: string | null
          last_sync_error: string | null
          products_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          merchant_id: string
          account_name?: string | null
          google_email?: string | null
          access_token_encrypted: string
          refresh_token_encrypted: string
          token_expires_at: string
          scopes?: string[]
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_status?: string | null
          last_sync_error?: string | null
          products_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          merchant_id?: string
          account_name?: string | null
          google_email?: string | null
          access_token_encrypted?: string
          refresh_token_encrypted?: string
          token_expires_at?: string
          scopes?: string[]
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_status?: string | null
          last_sync_error?: string | null
          products_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      google_ads_accounts: {
        Row: {
          id: string
          user_id: string
          merchant_account_id: string | null
          customer_id: string
          account_name: string | null
          google_email: string | null
          access_token_encrypted: string
          refresh_token_encrypted: string
          token_expires_at: string
          is_active: boolean
          last_sync_at: string | null
          last_sync_status: string | null
          last_sync_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          merchant_account_id?: string | null
          customer_id: string
          account_name?: string | null
          google_email?: string | null
          access_token_encrypted: string
          refresh_token_encrypted: string
          token_expires_at: string
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_status?: string | null
          last_sync_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          merchant_account_id?: string | null
          customer_id?: string
          account_name?: string | null
          google_email?: string | null
          access_token_encrypted?: string
          refresh_token_encrypted?: string
          token_expires_at?: string
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_status?: string | null
          last_sync_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_ads_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_ads_accounts_merchant_account_id_fkey"
            columns: ["merchant_account_id"]
            isOneToOne: false
            referencedRelation: "merchant_accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          merchant_account_id: string
          google_product_id: string
          offer_id: string | null
          title_original: string
          title_current: string
          description: string | null
          link: string | null
          image_link: string | null
          price_amount: number | null
          price_currency: string
          brand: string | null
          gtin: string | null
          mpn: string | null
          google_product_category: string | null
          product_type: string | null
          availability: string | null
          condition: string | null
          free_clicks_14d: number
          free_clicks_30d: number
          free_clicks_90d: number
          free_clicks_365d: number
          free_impressions_14d: number
          free_impressions_30d: number
          free_impressions_90d: number
          free_impressions_365d: number
          ads_clicks_14d: number
          ads_clicks_30d: number
          ads_clicks_90d: number
          ads_clicks_365d: number
          ads_impressions_14d: number
          ads_impressions_30d: number
          ads_impressions_90d: number
          ads_impressions_365d: number
          ads_cost_14d: number
          ads_cost_30d: number
          ads_conversions_14d: number
          ads_conversions_30d: number
          total_clicks_14d: number
          total_clicks_30d: number
          total_clicks_90d: number
          total_clicks_365d: number
          optimization_status: string
          times_optimized: number
          last_title_change_at: string | null
          last_synced_at: string | null
          google_last_update: string | null
          sync_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_account_id: string
          google_product_id: string
          offer_id?: string | null
          title_original: string
          title_current: string
          description?: string | null
          link?: string | null
          image_link?: string | null
          price_amount?: number | null
          price_currency?: string
          brand?: string | null
          gtin?: string | null
          mpn?: string | null
          google_product_category?: string | null
          product_type?: string | null
          availability?: string | null
          condition?: string | null
          free_clicks_14d?: number
          free_clicks_30d?: number
          free_clicks_90d?: number
          free_clicks_365d?: number
          free_impressions_14d?: number
          free_impressions_30d?: number
          free_impressions_90d?: number
          free_impressions_365d?: number
          ads_clicks_14d?: number
          ads_clicks_30d?: number
          ads_clicks_90d?: number
          ads_clicks_365d?: number
          ads_impressions_14d?: number
          ads_impressions_30d?: number
          ads_impressions_90d?: number
          ads_impressions_365d?: number
          ads_cost_14d?: number
          ads_cost_30d?: number
          ads_conversions_14d?: number
          ads_conversions_30d?: number
          optimization_status?: string
          times_optimized?: number
          last_title_change_at?: string | null
          last_synced_at?: string | null
          google_last_update?: string | null
          sync_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_account_id?: string
          google_product_id?: string
          offer_id?: string | null
          title_original?: string
          title_current?: string
          description?: string | null
          link?: string | null
          image_link?: string | null
          price_amount?: number | null
          price_currency?: string
          brand?: string | null
          gtin?: string | null
          mpn?: string | null
          google_product_category?: string | null
          product_type?: string | null
          availability?: string | null
          condition?: string | null
          free_clicks_14d?: number
          free_clicks_30d?: number
          free_clicks_90d?: number
          free_clicks_365d?: number
          free_impressions_14d?: number
          free_impressions_30d?: number
          free_impressions_90d?: number
          free_impressions_365d?: number
          ads_clicks_14d?: number
          ads_clicks_30d?: number
          ads_clicks_90d?: number
          ads_clicks_365d?: number
          ads_impressions_14d?: number
          ads_impressions_30d?: number
          ads_impressions_90d?: number
          ads_impressions_365d?: number
          ads_cost_14d?: number
          ads_cost_30d?: number
          ads_conversions_14d?: number
          ads_conversions_30d?: number
          optimization_status?: string
          times_optimized?: number
          last_title_change_at?: string | null
          last_synced_at?: string | null
          google_last_update?: string | null
          sync_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_merchant_account_id_fkey"
            columns: ["merchant_account_id"]
            isOneToOne: false
            referencedRelation: "merchant_accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      title_changes: {
        Row: {
          id: string
          product_id: string
          old_title: string
          new_title: string
          change_source: string
          ai_reasoning: string | null
          changed_at: string
          changed_by: string | null
          free_clicks_before_14d: number
          free_impressions_before_14d: number
          ads_clicks_before_14d: number
          ads_impressions_before_14d: number
          total_clicks_before_14d: number
          free_clicks_after_14d: number | null
          free_impressions_after_14d: number | null
          ads_clicks_after_14d: number | null
          ads_impressions_after_14d: number | null
          total_clicks_after_14d: number | null
          measured_at: string | null
          free_clicks_variation_percent: number | null
          ads_clicks_variation_percent: number | null
          total_clicks_variation_percent: number | null
          impact_status: string
          rolled_back_at: string | null
          rollback_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          old_title: string
          new_title: string
          change_source?: string
          ai_reasoning?: string | null
          changed_at?: string
          changed_by?: string | null
          free_clicks_before_14d: number
          free_impressions_before_14d: number
          ads_clicks_before_14d?: number
          ads_impressions_before_14d?: number
          total_clicks_before_14d: number
          free_clicks_after_14d?: number | null
          free_impressions_after_14d?: number | null
          ads_clicks_after_14d?: number | null
          ads_impressions_after_14d?: number | null
          total_clicks_after_14d?: number | null
          measured_at?: string | null
          free_clicks_variation_percent?: number | null
          ads_clicks_variation_percent?: number | null
          total_clicks_variation_percent?: number | null
          impact_status?: string
          rolled_back_at?: string | null
          rollback_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          old_title?: string
          new_title?: string
          change_source?: string
          ai_reasoning?: string | null
          changed_at?: string
          changed_by?: string | null
          free_clicks_before_14d?: number
          free_impressions_before_14d?: number
          ads_clicks_before_14d?: number
          ads_impressions_before_14d?: number
          total_clicks_before_14d?: number
          free_clicks_after_14d?: number | null
          free_impressions_after_14d?: number | null
          ads_clicks_after_14d?: number | null
          ads_impressions_after_14d?: number | null
          total_clicks_after_14d?: number | null
          measured_at?: string | null
          free_clicks_variation_percent?: number | null
          ads_clicks_variation_percent?: number | null
          total_clicks_variation_percent?: number | null
          impact_status?: string
          rolled_back_at?: string | null
          rollback_reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_changes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_changes_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_google_credentials: {
        Row: {
          id: string
          user_id: string
          google_client_id_encrypted: string
          google_client_secret_encrypted: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          google_client_id_encrypted: string
          google_client_secret_encrypted: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          google_client_id_encrypted?: string
          google_client_secret_encrypted?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_google_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_generation_logs: {
        Row: {
          id: string
          product_id: string
          user_id: string
          prompt_sent: string
          model_used: string
          suggestions_generated: Json | null
          tokens_input: number | null
          tokens_output: number | null
          suggestion_selected: string | null
          was_modified: boolean
          final_title_used: string | null
          response_time_ms: number | null
          error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          prompt_sent: string
          model_used?: string
          suggestions_generated?: Json | null
          tokens_input?: number | null
          tokens_output?: number | null
          suggestion_selected?: string | null
          was_modified?: boolean
          final_title_used?: string | null
          response_time_ms?: number | null
          error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          prompt_sent?: string
          model_used?: string
          suggestions_generated?: Json | null
          tokens_input?: number | null
          tokens_output?: number | null
          suggestion_selected?: string | null
          was_modified?: boolean
          final_title_used?: string | null
          response_time_ms?: number | null
          error?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
