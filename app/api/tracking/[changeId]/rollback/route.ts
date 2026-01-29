import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getValidAccessToken } from "@/lib/google/token-manager"
import { updateProductTitle } from "@/lib/google/merchant"

export async function POST(
  request: NextRequest,
  { params }: { params: { changeId: string } }
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
    const { reason } = body as { reason?: string }

    const adminSupabase = createAdminClient()

    // Get the title change with product and account info
    const { data: change, error: changeError } = await adminSupabase
      .from("title_changes")
      .select(
        `
        *,
        products!inner (
          id,
          merchant_account_id,
          google_product_id,
          title_original,
          merchant_accounts!inner (
            id,
            user_id,
            merchant_id
          )
        )
      `
      )
      .eq("id", params.changeId)
      .single()

    if (changeError || !change) {
      return NextResponse.json(
        { error: "Title change not found" },
        { status: 404 }
      )
    }

    // Verify user owns this account
    const product = change.products as Record<string, unknown>
    const merchantAccount = product.merchant_accounts as Record<string, unknown>

    if (merchantAccount.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (change.rolled_back_at) {
      return NextResponse.json(
        { error: "This change has already been rolled back" },
        { status: 400 }
      )
    }

    // Rollback: update title in Google Merchant Center to old_title
    const accessToken = await getValidAccessToken(merchantAccount.id as string)
    await updateProductTitle(
      accessToken,
      merchantAccount.merchant_id as string,
      product.google_product_id as string,
      change.old_title
    )

    // Update the title change record
    await adminSupabase
      .from("title_changes")
      .update({
        rolled_back_at: new Date().toISOString(),
        rollback_reason: reason || "Manual rollback",
      })
      .eq("id", change.id)

    // Update the product
    await adminSupabase
      .from("products")
      .update({
        title_current: change.old_title,
        optimization_status: "rolled_back",
      })
      .eq("id", change.product_id)

    return NextResponse.json({
      success: true,
      message: "Title rolled back successfully",
    })
  } catch (error) {
    console.error("Rollback error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to rollback"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
