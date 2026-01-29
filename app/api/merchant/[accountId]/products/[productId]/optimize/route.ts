import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateTitleSuggestions } from "@/lib/claude/client"

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

    // Generate suggestions with Claude
    const { result, tokensInput, tokensOutput, responseTimeMs, prompt } =
      await generateTitleSuggestions({
        title: product.title_current,
        description: product.description,
        price: product.price_amount,
        currency: product.price_currency,
        brand: product.brand,
        googleCategory: product.google_product_category,
        productType: product.product_type,
        gtin: product.gtin,
        condition: product.condition,
        freeClicks: product.free_clicks_14d,
        adsClicks: product.ads_clicks_14d,
        totalImpressions:
          product.free_impressions_14d + product.ads_impressions_14d,
      })

    // Log the generation
    const adminSupabase = createAdminClient()
    await adminSupabase.from("ai_generation_logs").insert({
      product_id: product.id,
      user_id: user.id,
      prompt_sent: prompt,
      model_used: "claude-sonnet-4-20250514",
      suggestions_generated: JSON.parse(JSON.stringify(result.suggestions)),
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      response_time_ms: responseTimeMs,
    })

    return NextResponse.json({
      suggestions: result.suggestions,
      product: {
        id: product.id,
        title_current: product.title_current,
        title_original: product.title_original,
      },
    })
  } catch (error) {
    console.error("Optimize error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to generate suggestions"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
