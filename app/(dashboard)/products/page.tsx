import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link2 } from "lucide-react"
import { ProductsPageClient } from "@/components/products/ProductsPageClient"

export default async function ProductsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get merchant accounts
  const { data: merchantAccounts } = await supabase
    .from("merchant_accounts")
    .select("id, account_name, products_count")
    .eq("user_id", user.id)
    .eq("is_active", true)

  const hasAccounts = merchantAccounts && merchantAccounts.length > 0

  if (!hasAccounts) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Link2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Connectez votre Merchant Center</CardTitle>
            <CardDescription>
              Pour voir et optimiser vos produits, commencez par connecter votre
              compte Google Merchant Center.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/dashboard/accounts">
              <Button>Connecter un compte</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
        <p className="text-muted-foreground">
          Visualisez et optimisez vos titres produits
        </p>
      </div>

      <ProductsPageClient merchantAccounts={merchantAccounts} />
    </div>
  )
}
