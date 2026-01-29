import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getValidAdsAccessToken } from "@/lib/google/token-manager"
import { getAllAdsMetrics } from "@/lib/google/ads"

export async function POST(
  request: NextRequest,
  { params }: { params: { adsAccountId: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the ads account belongs to the user
    const { data: adsAccount, error: accountError } = await supabase
      .from("google_ads_accounts")
      .select("*")
      .eq("id", params.adsAccountId)
      .eq("user_id", user.id)
      .single()

    if (accountError || !adsAccount) {
      return NextResponse.json(
        { error: "Google Ads account not found" },
        { status: 404 }
      )
    }

    if (!adsAccount.is_active) {
      return NextResponse.json(
        { error: "Account is inactive, please reconnect" },
        { status: 400 }
      )
    }

    if (adsAccount.customer_id === "pending") {
      return NextResponse.json(
        { error: "Customer ID not yet configured" },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Update sync status
    await adminSupabase
      .from("google_ads_accounts")
      .update({ last_sync_status: "syncing" })
      .eq("id", adsAccount.id)

    try {
      const accessToken = await getValidAdsAccessToken(adsAccount.id)

      // Fetch Ads metrics for all periods
      const { metrics14d, metrics30d, metrics90d, metrics365d } =
        await getAllAdsMetrics(accessToken, adsAccount.customer_id)

      // Build lookup maps
      const adsLookup = {
        d14: new Map(metrics14d.map((m) => [m.offerId, m])),
        d30: new Map(metrics30d.map((m) => [m.offerId, m])),
        d90: new Map(metrics90d.map((m) => [m.offerId, m])),
        d365: new Map(metrics365d.map((m) => [m.offerId, m])),
      }

      // Find the linked merchant account
      const merchantAccountId = adsAccount.merchant_account_id
      if (!merchantAccountId) {
        // Update sync status
        await adminSupabase
          .from("google_ads_accounts")
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: "error",
            last_sync_error: "No linked Merchant Center account",
          })
          .eq("id", adsAccount.id)

        return NextResponse.json(
          { error: "No linked Merchant Center account. Link a Merchant account first." },
          { status: 400 }
        )
      }

      // Get all products for the linked merchant account
      const { data: products } = await adminSupabase
        .from("products")
        .select("id, offer_id")
        .eq("merchant_account_id", merchantAccountId)

      if (!products || products.length === 0) {
        await adminSupabase
          .from("google_ads_accounts")
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: "success",
            last_sync_error: null,
          })
          .eq("id", adsAccount.id)

        return NextResponse.json({
          success: true,
          synced: 0,
          message: "No products found to update",
        })
      }

      let updatedCount = 0

      for (const product of products) {
        if (!product.offer_id) continue

        const a14 = adsLookup.d14.get(product.offer_id)
        const a30 = adsLookup.d30.get(product.offer_id)
        const a90 = adsLookup.d90.get(product.offer_id)
        const a365 = adsLookup.d365.get(product.offer_id)

        // Only update if we have any ads data for this product
        if (!a14 && !a30 && !a90 && !a365) continue

        // Get current product data to compute totals
        const { data: currentProduct } = await adminSupabase
          .from("products")
          .select("free_clicks_14d, free_clicks_30d, free_clicks_90d, free_clicks_365d")
          .eq("id", product.id)
          .single()

        const adsClicks14d = a14?.clicks || 0
        const adsClicks30d = a30?.clicks || 0
        const adsClicks90d = a90?.clicks || 0
        const adsClicks365d = a365?.clicks || 0

        await adminSupabase
          .from("products")
          .update({
            ads_clicks_14d: adsClicks14d,
            ads_clicks_30d: adsClicks30d,
            ads_clicks_90d: adsClicks90d,
            ads_clicks_365d: adsClicks365d,
            ads_impressions_14d: a14?.impressions || 0,
            ads_impressions_30d: a30?.impressions || 0,
            ads_impressions_90d: a90?.impressions || 0,
            ads_impressions_365d: a365?.impressions || 0,
            ads_cost_14d: a14 ? a14.costMicros / 1_000_000 : 0,
            ads_cost_30d: a30 ? a30.costMicros / 1_000_000 : 0,
            ads_conversions_14d: a14?.conversions || 0,
            ads_conversions_30d: a30?.conversions || 0,
            // Recompute totals
            total_clicks_14d: (currentProduct?.free_clicks_14d || 0) + adsClicks14d,
            total_clicks_30d: (currentProduct?.free_clicks_30d || 0) + adsClicks30d,
            total_clicks_90d: (currentProduct?.free_clicks_90d || 0) + adsClicks90d,
            total_clicks_365d: (currentProduct?.free_clicks_365d || 0) + adsClicks365d,
          })
          .eq("id", product.id)

        updatedCount++
      }

      // Update account sync status
      await adminSupabase
        .from("google_ads_accounts")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "success",
          last_sync_error: null,
        })
        .eq("id", adsAccount.id)

      return NextResponse.json({
        success: true,
        synced: updatedCount,
        total: products.length,
      })
    } catch (syncError) {
      const errorMessage =
        syncError instanceof Error ? syncError.message : "Unknown sync error"

      await adminSupabase
        .from("google_ads_accounts")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "error",
          last_sync_error: errorMessage,
        })
        .eq("id", adsAccount.id)

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error("Ads sync error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
