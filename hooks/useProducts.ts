"use client"

import { useState, useEffect, useCallback } from "react"

export interface Product {
  id: string
  merchant_account_id: string
  google_product_id: string
  offer_id: string | null
  title_original: string
  title_current: string
  image_link: string | null
  price_amount: number | null
  price_currency: string
  brand: string | null
  google_product_category: string | null
  product_type: string | null
  availability: string | null
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
  total_clicks_14d: number
  total_clicks_30d: number
  total_clicks_90d: number
  total_clicks_365d: number
  optimization_status: string
  times_optimized: number
  last_title_change_at: string | null
  last_synced_at: string | null
}

export type Period = "14d" | "30d" | "90d" | "365d"
export type TrafficSource = "total" | "free" | "ads"

interface UseProductsOptions {
  merchantAccountId?: string
  period?: Period
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

interface UseProductsReturn {
  products: Product[]
  total: number
  page: number
  totalPages: number
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const {
    merchantAccountId,
    period = "30d",
    status = "all",
    search = "",
    page = 1,
    pageSize = 50,
  } = options

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        period,
        status,
        search,
        page: String(page),
        pageSize: String(pageSize),
      })

      if (merchantAccountId) {
        params.set("merchantAccountId", merchantAccountId)
      }

      const response = await fetch(`/api/products?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      setProducts(data.products)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [merchantAccountId, period, status, search, page, pageSize])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    total,
    page,
    totalPages,
    loading,
    error,
    refetch: fetchProducts,
  }
}
