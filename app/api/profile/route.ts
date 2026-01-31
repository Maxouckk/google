import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { full_name } = body as { full_name?: string }

    if (typeof full_name !== "string" || full_name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase
      .from("users")
      .update({ full_name: full_name.trim() })
      .eq("id", user.id)

    if (error) {
      console.error("Profile update error:", error)
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { confirmation } = body as { confirmation?: string }

    if (confirmation !== "SUPPRIMER") {
      return NextResponse.json(
        { error: "Confirmation incorrecte" },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Deactivate merchant accounts
    await adminSupabase
      .from("merchant_accounts")
      .update({ is_active: false })
      .eq("user_id", user.id)

    // Deactivate ads accounts
    await adminSupabase
      .from("google_ads_accounts")
      .update({ is_active: false })
      .eq("user_id", user.id)

    // Delete user auth (this cascades in Supabase)
    const { error } = await adminSupabase.auth.admin.deleteUser(user.id)

    if (error) {
      console.error("Delete user error:", error)
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
