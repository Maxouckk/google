import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getValidAccessToken } from "@/lib/google/token-manager"
import { updateProductTitle } from "@/lib/google/merchant"

export async function POST(
  request: NextRequest,
  { params }: { params: { accountId: string; productId: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { newTitle, aiReasoning, changeSource } = body as {
      newTitle: string
      aiReasoning?: string
      changeSource?: string
    }

    if (!newTitle || newTitle.trim().length === 0) {
      return NextResponse.json(
        { error: "New title is required" },
        { status: 400 }
      )
    }

    if (newTitle.length > 150) {
      return NextResponse.json(
        { error: "Title must be 150 characters or less" },
        { status: 400 }
      )
    }

    // Verify the account belongs to the user
    const { data: account } = await supabase
      .from("merchant_accounts")
      .select("id, merchant_id")
      .eq("id", params.accountId)
      .eq("user_id", user.id)
      .single()

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Get the product
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", params.productId)
      .eq("merchant_account_id", account.id)
      .single()

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const adminSupabase = createAdminClient()

    // 1. Update title in Google Merchant Center
    const accessToken = await getValidAccessToken(account.id)
    await updateProductTitle(
      accessToken,
      account.merchant_id,
      product.google_product_id,
      newTitle.trim()
    )

    // 2. Record the title change
    await adminSupabase.from("title_changes").insert({
      product_id: product.id,
      old_title: product.title_current,
      new_title: newTitle.trim(),
      change_source: changeSource || "ai_suggestion",
      ai_reasoning: aiReasoning || null,
      changed_by: user.id,
      free_clicks_before_14d: product.free_clicks_14d,
      free_impressions_before_14d: product.free_impressions_14d,
      ads_clicks_before_14d: product.ads_clicks_14d,
      ads_impressions_before_14d: product.ads_impressions_14d,
      total_clicks_before_14d: product.total_clicks_14d,
      impact_status: "pending",
    })

    // 3. Update the product in our database
    await adminSupabase
      .from("products")
      .update({
        title_current: newTitle.trim(),
        optimization_status: "testing",
        times_optimized: product.times_optimized + 1,
        last_title_change_at: new Date().toISOString(),
      })
      .eq("id", product.id)

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title_current: newTitle.trim(),
        optimization_status: "testing",
      },
    })
  } catch (error) {
    console.error("Update title error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to update title"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
