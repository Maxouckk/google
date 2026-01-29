import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/layout/DashboardShell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch profile, merchant accounts, and ads accounts in parallel
  const [profileResult, merchantResult, adsResult] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user.id).single(),
    supabase
      .from("merchant_accounts")
      .select("id, merchant_id, account_name, products_count")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("google_ads_accounts")
      .select("id, customer_id, account_name, merchant_account_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ])

  return (
    <DashboardShell
      user={{
        email: user.email || "",
        full_name: profileResult.data?.full_name,
      }}
      merchantAccounts={merchantResult.data || []}
      adsAccounts={adsResult.data || []}
    >
      {children}
    </DashboardShell>
  )
}
