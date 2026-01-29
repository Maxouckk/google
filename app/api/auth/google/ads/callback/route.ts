import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { exchangeCodeForTokens, getUserInfo } from "@/lib/google/oauth"
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
    const storedState = request.cookies.get("oauth_state_ads")?.value
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
      process.env.GOOGLE_REDIRECT_URI_ADS!
    )

    // Get user info from Google
    const googleUserInfo = await getUserInfo(accessToken)

    // For Google Ads, we need the customer ID which would typically come from
    // the Google Ads API. For now, we'll create a placeholder that the user
    // can update later, or we could prompt for it.
    // In a real implementation, you'd use the Google Ads API to list accessible accounts.

    const adminSupabase = createAdminClient()

    // For now, create a pending entry - in production, you'd fetch actual customer IDs
    const { error: insertError } = await adminSupabase
      .from("google_ads_accounts")
      .insert({
        user_id: userId,
        customer_id: "pending", // This would be fetched from Google Ads API
        account_name: "Google Ads Account",
        google_email: googleUserInfo.email,
        access_token_encrypted: encrypt(accessToken),
        refresh_token_encrypted: encrypt(refreshToken),
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
      })

    if (insertError) {
      console.error("Failed to save Google Ads account:", insertError)
      return NextResponse.redirect(
        new URL("/dashboard/accounts?error=save_failed", request.url)
      )
    }

    // Clear the state cookie
    const response = NextResponse.redirect(
      new URL("/dashboard/accounts?success=ads_connected", request.url)
    )
    response.cookies.delete("oauth_state_ads")

    return response
  } catch (error) {
    console.error("Ads OAuth callback error:", error)
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=oauth_failed", request.url)
    )
  }
}
