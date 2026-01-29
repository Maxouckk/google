import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getValidAccessToken } from "@/lib/google/token-manager"
import { getProducts } from "@/lib/google/merchant"
import { getAllFreeListingsMetrics } from "@/lib/google/merchant-reports"

export async function POST(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the account belongs to the user
    const { data: account, error: accountError } = await supabase
      .from("merchant_accounts")
      .select("*")
      .eq("id", params.accountId)
      .eq("user_id", user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    if (!account.is_active) {
      return NextResponse.json(
        { error: "Account is inactive, please reconnect" },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Update sync status
    await adminSupabase
      .from("merchant_accounts")
      .update({ last_sync_status: "syncing" })
      .eq("id", account.id)

    try {
      // 1. Get valid access token (auto-refreshes if needed)
      const accessToken = await getValidAccessToken(account.id)

      // 2. Fetch products from Merchant Center
      const googleProducts = await getProducts(accessToken, account.merchant_id)

      // 3. Fetch free listings metrics for all periods
      const { metrics14d, metrics30d, metrics90d, metrics365d } =
        await getAllFreeListingsMetrics(accessToken, account.merchant_id)

      // Build metrics lookup maps
      const metricsLookup = {
        d14: new Map(metrics14d.map((m) => [m.offerId, m])),
        d30: new Map(metrics30d.map((m) => [m.offerId, m])),
        d90: new Map(metrics90d.map((m) => [m.offerId, m])),
        d365: new Map(metrics365d.map((m) => [m.offerId, m])),
      }

      // 4. Upsert products into database
      let syncedCount = 0

      for (const product of googleProducts) {
        const googleProductId = product.id || ""
        const offerId = product.offerId || ""

        if (!googleProductId) continue

        const m14 = metricsLookup.d14.get(offerId)
        const m30 = metricsLookup.d30.get(offerId)
        const m90 = metricsLookup.d90.get(offerId)
        const m365 = metricsLookup.d365.get(offerId)

        const priceAmount = product.price?.value
          ? parseFloat(product.price.value)
          : null

        const productData = {
          merchant_account_id: account.id,
          google_product_id: googleProductId,
          offer_id: offerId || null,
          title_original: product.title || "",
          title_current: product.title || "",
          description: product.description || null,
          link: product.link || null,
          image_link: product.imageLink || null,
          price_amount: priceAmount,
          price_currency: product.price?.currency || "EUR",
          brand: product.brand || null,
          gtin: product.gtin || null,
          mpn: product.mpn || null,
          google_product_category: product.googleProductCategory || null,
          product_type: product.productTypes?.[0] || null,
          availability: product.availability || null,
          condition: product.condition || null,
          free_clicks_14d: m14?.clicks || 0,
          free_clicks_30d: m30?.clicks || 0,
          free_clicks_90d: m90?.clicks || 0,
          free_clicks_365d: m365?.clicks || 0,
          free_impressions_14d: m14?.impressions || 0,
          free_impressions_30d: m30?.impressions || 0,
          free_impressions_90d: m90?.impressions || 0,
          free_impressions_365d: m365?.impressions || 0,
          last_synced_at: new Date().toISOString(),
        }

        // Check if product already exists
        const { data: existing } = await adminSupabase
          .from("products")
          .select("id, title_original, optimization_status")
          .eq("merchant_account_id", account.id)
          .eq("google_product_id", googleProductId)
          .single()

        if (existing) {
          // Update existing - keep title_original and title_current if optimized
          const updateData: Record<string, unknown> = { ...productData }
          delete updateData.title_original

          // If the product is being tested or optimized, don't overwrite title_current
          if (
            existing.optimization_status === "testing" ||
            existing.optimization_status === "optimized"
          ) {
            delete updateData.title_current
          }

          await adminSupabase
            .from("products")
            .update(updateData)
            .eq("id", existing.id)
        } else {
          await adminSupabase.from("products").insert(productData)
        }

        syncedCount++
      }

      // 5. Update account sync status
      await adminSupabase
        .from("merchant_accounts")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "success",
          last_sync_error: null,
          products_count: syncedCount,
        })
        .eq("id", account.id)

      return NextResponse.json({
        success: true,
        synced: syncedCount,
        total: googleProducts.length,
      })
    } catch (syncError) {
      const errorMessage =
        syncError instanceof Error ? syncError.message : "Unknown sync error"

      await adminSupabase
        .from("merchant_accounts")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "error",
          last_sync_error: errorMessage,
        })
        .eq("id", account.id)

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
