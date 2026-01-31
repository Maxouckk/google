import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAdsAuthUrl } from "@/lib/google/oauth"
import { getUserGoogleCredentials } from "@/lib/google/user-credentials"
import crypto from "crypto"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's own Google OAuth credentials
    let credentials
    try {
      credentials = await getUserGoogleCredentials(user.id)
    } catch {
      return NextResponse.redirect(
        new URL("/accounts?error=no_credentials", process.env.NEXT_PUBLIC_APP_URL!)
      )
    }

    // Generate a state parameter with user ID for security
    const state = crypto.randomBytes(16).toString("hex") + ":" + user.id

    // Get auth URL
    const authUrl = getAdsAuthUrl(state, credentials)

    const response = NextResponse.redirect(authUrl)
    response.cookies.set("oauth_state_ads", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
    })

    return response
  } catch (error) {
    console.error("Ads OAuth init error:", error)
    return NextResponse.json(
      { error: "Failed to initiate OAuth" },
      { status: 500 }
    )
  }
}
