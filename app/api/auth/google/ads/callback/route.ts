import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { exchangeCodeForTokens, getUserInfo } from "@/lib/google/oauth"
import { getUserGoogleCredentials } from "@/lib/google/user-credentials"
import { encrypt } from "@/lib/encryption"
import { listAdsCustomerAccounts } from "@/lib/google/ads"

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
        new URL("/accounts?error=oauth_denied", request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/accounts?error=missing_params", request.url)
      )
    }

    // Verify state
    const storedState = request.cookies.get("oauth_state_ads")?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL("/accounts?error=invalid_state", request.url)
      )
    }

    // Extract user ID from state
    const userId = state.split(":")[1]
    if (!userId) {
      return NextResponse.redirect(
        new URL("/accounts?error=invalid_state", request.url)
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

    // Fetch user's own Google OAuth credentials
    const credentials = await getUserGoogleCredentials(user.id)

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/ads/callback`

    // Exchange code for tokens
    const { accessToken, refreshToken, expiresAt } = await exchangeCodeForTokens(
      code,
      redirectUri,
      credentials
    )

    // Get user info from Google
    const googleUserInfo = await getUserInfo(accessToken, credentials)

    const adminSupabase = createAdminClient()

    // Fetch accessible Google Ads customer accounts
    let customerAccounts: { customerId: string; descriptiveName: string }[] = []
    try {
      customerAccounts = await listAdsCustomerAccounts(accessToken)
    } catch (adsError) {
      console.error("Failed to list Ads accounts:", adsError)
      // Fallback: create a single entry that user can configure
      customerAccounts = [
        { customerId: "pending", descriptiveName: "Google Ads Account" },
      ]
    }

    if (customerAccounts.length === 0) {
      return NextResponse.redirect(
        new URL("/accounts?error=no_ads_accounts", request.url)
      )
    }

    // Get user's merchant accounts to try to link
    const { data: merchantAccounts } = await adminSupabase
      .from("merchant_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1)

    const merchantAccountId = merchantAccounts?.[0]?.id || null

    // Insert all found customer accounts
    for (const account of customerAccounts) {
      // Check if this customer_id already exists for this user
      const { data: existing } = await adminSupabase
        .from("google_ads_accounts")
        .select("id")
        .eq("user_id", userId)
        .eq("customer_id", account.customerId)
        .single()

      if (existing) {
        // Update existing account tokens
        await adminSupabase
          .from("google_ads_accounts")
          .update({
            access_token_encrypted: encrypt(accessToken),
            refresh_token_encrypted: encrypt(refreshToken),
            token_expires_at: expiresAt.toISOString(),
            is_active: true,
            account_name: account.descriptiveName,
            google_email: googleUserInfo.email,
          })
          .eq("id", existing.id)
      } else {
        await adminSupabase.from("google_ads_accounts").insert({
          user_id: userId,
          merchant_account_id: merchantAccountId,
          customer_id: account.customerId,
          account_name: account.descriptiveName,
          google_email: googleUserInfo.email,
          access_token_encrypted: encrypt(accessToken),
          refresh_token_encrypted: encrypt(refreshToken),
          token_expires_at: expiresAt.toISOString(),
          is_active: true,
        })
      }
    }

    // Clear the state cookie
    const response = NextResponse.redirect(
      new URL("/accounts?success=ads_connected", request.url)
    )
    response.cookies.delete("oauth_state_ads")

    return response
  } catch (error) {
    console.error("Ads OAuth callback error:", error)
    return NextResponse.redirect(
      new URL("/accounts?error=oauth_failed", request.url)
    )
  }
}
