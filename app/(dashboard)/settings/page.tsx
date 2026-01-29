import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsPageClient } from "@/components/settings/SettingsPageClient"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single()

  return (
    <SettingsPageClient
      profile={{
        full_name: dbUser?.full_name || null,
        email: user.email || "",
      }}
    />
  )
}
