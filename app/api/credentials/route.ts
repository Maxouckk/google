import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { encrypt, decrypt } from "@/lib/encryption"

// GET: check if user has configured credentials (returns boolean, never the secrets)
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const { data } = await adminSupabase
      .from("user_google_credentials")
      .select("id, google_client_id_encrypted, created_at, updated_at")
      .eq("user_id", user.id)
      .single()

    if (!data) {
      return NextResponse.json({ configured: false })
    }

    // Return masked client ID so the user can identify their credentials
    const clientId = decrypt(data.google_client_id_encrypted)
    const maskedClientId =
      clientId.substring(0, 8) + "..." + clientId.substring(clientId.length - 20)

    return NextResponse.json({
      configured: true,
      maskedClientId,
      updatedAt: data.updated_at,
    })
  } catch (error) {
    console.error("Get credentials error:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// POST: save or update user's Google OAuth credentials
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { googleClientId, googleClientSecret } = body

    if (!googleClientId || !googleClientSecret) {
      return NextResponse.json(
        { error: "Client ID et Client Secret sont requis" },
        { status: 400 }
      )
    }

    // Basic validation
    if (!googleClientId.includes(".apps.googleusercontent.com")) {
      return NextResponse.json(
        { error: "Le Client ID doit se terminer par .apps.googleusercontent.com" },
        { status: 400 }
      )
    }

    if (!googleClientSecret.startsWith("GOCSPX-")) {
      return NextResponse.json(
        { error: "Le Client Secret doit commencer par GOCSPX-" },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Check if credentials already exist
    const { data: existing } = await adminSupabase
      .from("user_google_credentials")
      .select("id")
      .eq("user_id", user.id)
      .single()

    const encryptedData = {
      google_client_id_encrypted: encrypt(googleClientId.trim()),
      google_client_secret_encrypted: encrypt(googleClientSecret.trim()),
    }

    if (existing) {
      await adminSupabase
        .from("user_google_credentials")
        .update({
          ...encryptedData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
    } else {
      await adminSupabase.from("user_google_credentials").insert({
        user_id: user.id,
        ...encryptedData,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Save credentials error:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement" },
      { status: 500 }
    )
  }
}

// DELETE: remove user's Google OAuth credentials
export async function DELETE() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    await adminSupabase
      .from("user_google_credentials")
      .delete()
      .eq("user_id", user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete credentials error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    )
  }
}
