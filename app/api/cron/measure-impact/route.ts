import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getValidAccessToken } from "@/lib/google/token-manager"
import { getFreeListingsMetrics } from "@/lib/google/merchant-reports"
import {
  IMPACT_MEASUREMENT_DAYS,
  POSITIVE_IMPACT_THRESHOLD,
  NEGATIVE_IMPACT_THRESHOLD,
} from "@/lib/constants"

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Find title changes that are pending and older than IMPACT_MEASUREMENT_DAYS
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - IMPACT_MEASUREMENT_DAYS)

    const { data: pendingChanges, error: fetchError } = await supabase
      .from("title_changes")
      .select(
        `
        *,
        products!inner (
          id,
          merchant_account_id,
          offer_id,
          merchant_accounts!inner (
            id,
            merchant_id,
            is_active
          )
        )
      `
      )
      .eq("impact_status", "pending")
      .lte("changed_at", cutoffDate.toISOString())
      .is("measured_at", null)

    if (fetchError) {
      console.error("Error fetching pending changes:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch pending changes" },
        { status: 500 }
      )
    }

    if (!pendingChanges || pendingChanges.length === 0) {
      return NextResponse.json({
        message: "No changes to measure",
        measured: 0,
      })
    }

    let measuredCount = 0
    const errors: string[] = []

    for (const change of pendingChanges) {
      try {
        const product = change.products as Record<string, unknown>
        const merchantAccount = (product.merchant_accounts as Record<string, unknown>)

        if (!merchantAccount || !(merchantAccount.is_active as boolean)) {
          continue
        }

        const merchantAccountId = merchantAccount.id as string
        const merchantId = merchantAccount.merchant_id as string
        const offerId = product.offer_id as string

        // Get fresh 14-day metrics
        const accessToken = await getValidAccessToken(merchantAccountId)
        const metrics = await getFreeListingsMetrics(accessToken, merchantId, 14)

        // Find metrics for this product
        const productMetrics = metrics.find((m) => m.offerId === offerId)
        const freeClicksAfter = productMetrics?.clicks || 0
        const freeImpressionsAfter = productMetrics?.impressions || 0

        // Calculate variations
        const freeClicksBefore = change.free_clicks_before_14d || 0
        const totalClicksBefore = change.total_clicks_before_14d || 0

        const freeClicksVariation =
          freeClicksBefore > 0
            ? ((freeClicksAfter - freeClicksBefore) / freeClicksBefore) * 100
            : freeClicksAfter > 0
              ? 100
              : 0

        const totalClicksAfter = freeClicksAfter // For now, only free listings
        const totalClicksVariation =
          totalClicksBefore > 0
            ? ((totalClicksAfter - totalClicksBefore) / totalClicksBefore) * 100
            : totalClicksAfter > 0
              ? 100
              : 0

        // Determine impact status
        let impactStatus: string
        if (totalClicksVariation >= POSITIVE_IMPACT_THRESHOLD) {
          impactStatus = "positive"
        } else if (totalClicksVariation <= NEGATIVE_IMPACT_THRESHOLD) {
          impactStatus = "negative"
        } else {
          impactStatus = "neutral"
        }

        // Update the title change record
        await supabase
          .from("title_changes")
          .update({
            free_clicks_after_14d: freeClicksAfter,
            free_impressions_after_14d: freeImpressionsAfter,
            total_clicks_after_14d: totalClicksAfter,
            free_clicks_variation_percent: Math.round(freeClicksVariation * 100) / 100,
            total_clicks_variation_percent: Math.round(totalClicksVariation * 100) / 100,
            impact_status: impactStatus,
            measured_at: new Date().toISOString(),
          })
          .eq("id", change.id)

        // Update product optimization_status
        await supabase
          .from("products")
          .update({
            optimization_status: impactStatus === "negative" ? "testing" : "optimized",
          })
          .eq("id", change.product_id)

        measuredCount++
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        errors.push(`Change ${change.id}: ${msg}`)
        console.error(`Error measuring change ${change.id}:`, err)
      }
    }

    return NextResponse.json({
      message: `Measured ${measuredCount} changes`,
      measured: measuredCount,
      total: pendingChanges.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Cron measure-impact error:", error)
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
