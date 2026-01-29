"use client"

import { useState, useEffect, useCallback } from "react"

export interface TitleChangeProduct {
  id: string
  merchant_account_id: string
  google_product_id: string
  offer_id: string | null
  title_original: string
  title_current: string
  image_link: string | null
  brand: string | null
  optimization_status: string
}

export interface TitleChange {
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
  total_clicks_variation_percent: number | null
  impact_status: string
  rolled_back_at: string | null
  rollback_reason: string | null
  created_at: string
  products: TitleChangeProduct
}

interface UseTrackingOptions {
  merchantAccountId?: string
  impactStatus?: string
  page?: number
  pageSize?: number
}

interface UseTrackingReturn {
  changes: TitleChange[]
  total: number
  page: number
  totalPages: number
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useTracking(options: UseTrackingOptions = {}): UseTrackingReturn {
  const {
    merchantAccountId,
    impactStatus = "all",
    page = 1,
    pageSize = 50,
  } = options

  const [changes, setChanges] = useState<TitleChange[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChanges = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        impactStatus,
        page: String(page),
        pageSize: String(pageSize),
      })

      if (merchantAccountId) {
        params.set("merchantAccountId", merchantAccountId)
      }

      const response = await fetch(`/api/tracking?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch tracking data")
      }

      const data = await response.json()
      setChanges(data.changes)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [merchantAccountId, impactStatus, page, pageSize])

  useEffect(() => {
    fetchChanges()
  }, [fetchChanges])

  return {
    changes,
    total,
    page,
    totalPages,
    loading,
    error,
    refetch: fetchChanges,
  }
}
