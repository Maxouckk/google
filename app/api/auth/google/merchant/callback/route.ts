import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { exchangeCodeForTokens, getUserInfo } from "@/lib/google/oauth"
import { listMerchantAccounts } from "@/lib/google/merchant"
import { encrypt } from "@/lib/encryption"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Check for OAuth errors
    if (error) {
      console.error("OAuth error:", error)
      return NextResponse.redirect(
        new URL("/dashboard/accounts?error=oauth_denied", request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/accounts?error=missing_params", request.url)
      )
    }

    // Verify state
    const storedState = request.cookies.get("oauth_state")?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL("/dashboard/accounts?error=invalid_state", request.url)
      )
    }

    // Extract user ID from state
    const userId = state.split(":")[1]
    if (!userId) {
      return NextResponse.redirect(
        new URL("/dashboard/accounts?error=invalid_state", request.url)
      )
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.redirect(
        new URL("/login?error=session_expired", request.url)
      )
    }

    // Exchange code for tokens
    const { accessToken, refreshToken, expiresAt } = await exchangeCodeForTokens(
      code,
      process.env.GOOGLE_REDIRECT_URI_MERCHANT!
    )

    // Get user info from Google
    const googleUserInfo = await getUserInfo(accessToken)

    // Get available Merchant Center accounts
    const merchantAccounts = await listMerchantAccounts(accessToken)

    if (merchantAccounts.length === 0) {
      return NextResponse.redirect(
        new URL("/dashboard/accounts?error=no_merchant_accounts", request.url)
      )
    }

    // Save each merchant account to database
    const adminSupabase = createAdminClient()

    for (const account of merchantAccounts) {
      if (!account.id) continue

      const merchantId = account.id.toString()

      // Check if account already exists
      const { data: existingAccount } = await adminSupabase
        .from("merchant_accounts")
        .select("id")
        .eq("user_id", userId)
        .eq("merchant_id", merchantId)
        .single()

      const accountData = {
        user_id: userId,
        merchant_id: merchantId,
        account_name: account.name || `Compte ${merchantId}`,
        google_email: googleUserInfo.email,
        access_token_encrypted: encrypt(accessToken),
        refresh_token_encrypted: encrypt(refreshToken),
        token_expires_at: expiresAt.toISOString(),
        scopes: ["https://www.googleapis.com/auth/content"],
        is_active: true,
        last_sync_status: null,
        last_sync_error: null,
      }

      if (existingAccount) {
        // Update existing account
        await adminSupabase
          .from("merchant_accounts")
          .update(accountData)
          .eq("id", existingAccount.id)
      } else {
        // Insert new account
        await adminSupabase.from("merchant_accounts").insert(accountData)
      }
    }

    // Clear the state cookie
    const response = NextResponse.redirect(
      new URL("/dashboard/accounts?success=merchant_connected", request.url)
    )
    response.cookies.delete("oauth_state")

    return response
  } catch (error) {
    console.error("Merchant OAuth callback error:", error)
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=oauth_failed", request.url)
    )
  }
}
