import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getMerchantAuthUrl } from "@/lib/google/oauth"
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

    // Generate a state parameter with user ID for security
    const state = crypto.randomBytes(16).toString("hex") + ":" + user.id

    // Store state in a cookie for verification
    const authUrl = getMerchantAuthUrl(state)

    const response = NextResponse.redirect(authUrl)
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
    })

    return response
  } catch (error) {
    console.error("Merchant OAuth init error:", error)
    return NextResponse.json(
      { error: "Failed to initiate OAuth" },
      { status: 500 }
    )
  }
}
