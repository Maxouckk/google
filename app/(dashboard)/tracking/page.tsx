import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TrackingPageClient } from "@/components/tracking/TrackingPageClient"

export default async function TrackingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: merchantAccounts } = await supabase
    .from("merchant_accounts")
    .select("id, merchant_id, account_name")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })

  return (
    <TrackingPageClient merchantAccounts={merchantAccounts || []} />
  )
}
