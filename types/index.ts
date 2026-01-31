export * from "./database"

// Product optimization status
export type OptimizationStatus = "original" | "testing" | "optimized" | "rolled_back"

// Impact status for title changes
export type ImpactStatus = "pending" | "positive" | "neutral" | "negative"

// Change source for title changes
export type ChangeSource = "ai_suggestion" | "manual" | "rollback"

// Sync status
export type SyncStatus = "success" | "error" | "partial"

// Period filter options
export type PeriodFilter = "14d" | "30d" | "90d" | "365d"

// Traffic source filter
export type TrafficSourceFilter = "all" | "free" | "paid"

// AI Suggestion type
export interface AISuggestion {
  title: string
  reasoning: string
  changes: string[]
}

// AI Response type
export interface AIOptimizationResponse {
  suggestions: AISuggestion[]
}

// Product with computed fields for display
export interface ProductWithMetrics {
  id: string
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
  google_product_category: string | null
  product_type: string | null
  availability: string | null
  condition: string | null
  optimization_status: OptimizationStatus
  times_optimized: number
  last_title_change_at: string | null
  // Metrics based on selected period
  clicks: number
  impressions: number
  free_clicks: number
  ads_clicks: number
}

// Title change with product info
export interface TitleChangeWithProduct {
  id: string
  product_id: string
  old_title: string
  new_title: string
  change_source: ChangeSource
  ai_reasoning: string | null
  changed_at: string
  total_clicks_before_14d: number
  total_clicks_after_14d: number | null
  total_clicks_variation_percent: number | null
  impact_status: ImpactStatus
  rolled_back_at: string | null
  product: {
    title_current: string
    image_link: string | null
    offer_id: string | null
  }
}
