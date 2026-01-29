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
import { Package, Link2 } from "lucide-react"

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
  const totalProducts =
    merchantAccounts?.reduce((sum, acc) => sum + (acc.products_count || 0), 0) ||
    0

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

  if (totalProducts === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
          <p className="text-muted-foreground">
            Visualisez et optimisez vos titres produits
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Aucun produit synchronisé</CardTitle>
            <CardDescription>
              Synchronisez vos produits depuis la page Comptes pour commencer.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/dashboard/accounts">
              <Button>Aller aux comptes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // TODO: Implement full products table with filtering
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
          <p className="text-muted-foreground">
            {totalProducts} produit{totalProducts > 1 ? "s" : ""} synchronisé
            {totalProducts > 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="outline">Synchroniser</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tableau des produits</CardTitle>
          <CardDescription>
            La liste complète de vos produits sera affichée ici avec les
            métriques de performance et les options d&apos;optimisation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fonctionnalité en cours de développement...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
