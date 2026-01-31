import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const merchantAccountId = searchParams.get("merchantAccountId")
    const period = searchParams.get("period") || "30d"
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(
      searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE),
      10
    )

    // Determine sort column based on period
    const sortColumn = `total_clicks_${period}` as const
    const validSortColumns = [
      "total_clicks_14d",
      "total_clicks_30d",
      "total_clicks_90d",
      "total_clicks_365d",
    ]
    const finalSortColumn = validSortColumns.includes(sortColumn)
      ? sortColumn
      : "total_clicks_30d"

    // Build query
    let query = supabase
      .from("products")
      .select(
        `
        id,
        merchant_account_id,
        google_product_id,
        offer_id,
        title_original,
        title_current,
        image_link,
        price_amount,
        price_currency,
        brand,
        google_product_category,
        product_type,
        availability,
        free_clicks_14d,
        free_clicks_30d,
        free_clicks_90d,
        free_clicks_365d,
        free_impressions_14d,
        free_impressions_30d,
        free_impressions_90d,
        free_impressions_365d,
        ads_clicks_14d,
        ads_clicks_30d,
        ads_clicks_90d,
        ads_clicks_365d,
        ads_impressions_14d,
        ads_impressions_30d,
        ads_impressions_90d,
        ads_impressions_365d,
        total_clicks_14d,
        total_clicks_30d,
        total_clicks_90d,
        total_clicks_365d,
        optimization_status,
        times_optimized,
        last_title_change_at,
        last_synced_at
      `,
        { count: "exact" }
      )

    // Filter by merchant account
    if (merchantAccountId) {
      query = query.eq("merchant_account_id", merchantAccountId)
    } else {
      // Get all merchant accounts for this user
      const { data: accounts } = await supabase
        .from("merchant_accounts")
        .select("id")
        .eq("user_id", user.id)

      if (accounts && accounts.length > 0) {
        query = query.in(
          "merchant_account_id",
          accounts.map((a) => a.id)
        )
      } else {
        return NextResponse.json({
          products: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        })
      }
    }

    // Filter by status
    if (status !== "all") {
      query = query.eq("optimization_status", status)
    }

    // Search by title
    if (search) {
      query = query.or(
        `title_current.ilike.%${search}%,title_original.ilike.%${search}%,brand.ilike.%${search}%,offer_id.ilike.%${search}%`
      )
    }

    // Sort and paginate
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    query = query
      .order(finalSortColumn, { ascending: false })
      .range(from, to)

    const { data: products, error, count } = await query

    if (error) {
      console.error("Products query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error) {
    console.error("Products API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
