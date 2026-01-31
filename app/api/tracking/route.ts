import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const impactStatus = searchParams.get("impactStatus") || "all"
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "50")

    // Get user's merchant accounts
    const { data: accounts } = await supabase
      .from("merchant_accounts")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        changes: [],
        total: 0,
        page,
        totalPages: 0,
      })
    }

    const accountIds = merchantAccountId
      ? [merchantAccountId]
      : accounts.map((a) => a.id)

    // Build query for title_changes joined with products
    let query = supabase
      .from("title_changes")
      .select(
        `
        *,
        products!inner (
          id,
          merchant_account_id,
          google_product_id,
          offer_id,
          title_original,
          title_current,
          image_link,
          brand,
          optimization_status
        )
      `,
        { count: "exact" }
      )
      .in("products.merchant_account_id", accountIds)
      .order("changed_at", { ascending: false })

    if (impactStatus !== "all") {
      query = query.eq("impact_status", impactStatus)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: changes, count, error } = await query

    if (error) {
      console.error("Tracking query error:", error)
      return NextResponse.json(
        { error: "Failed to fetch tracking data" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      changes: changes || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error) {
    console.error("Tracking API error:", error)
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
