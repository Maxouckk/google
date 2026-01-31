import { createClient } from "@/lib/supabase/server"
import { MerchantAccountCard } from "@/components/accounts/MerchantAccountCard"
import { ConnectMerchantButton } from "@/components/accounts/ConnectMerchantButton"
import { ConnectGoogleAdsButton } from "@/components/accounts/ConnectGoogleAdsButton"
import { GoogleAdsAccountCard } from "@/components/accounts/GoogleAdsAccountCard"
import { GoogleCredentialsForm } from "@/components/accounts/GoogleCredentialsForm"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { ShoppingCart, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SearchParams {
  success?: string
  error?: string
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Check if user has configured Google credentials
  const { data: credentials } = await supabase
    .from("user_google_credentials")
    .select("id")
    .eq("user_id", user.id)
    .single()

  const hasCredentials = !!credentials

  // Get merchant accounts
  const { data: merchantAccounts } = await supabase
    .from("merchant_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Get Google Ads accounts
  const { data: adsAccounts } = await supabase
    .from("google_ads_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Success/error messages
  const successMessages: Record<string, string> = {
    merchant_connected: "Compte Merchant Center connecté avec succès",
    ads_connected: "Compte Google Ads connecté avec succès",
  }

  const errorMessages: Record<string, string> = {
    oauth_denied: "Vous avez refusé l'autorisation",
    missing_params: "Paramètres manquants dans la réponse",
    invalid_state: "Session expirée, veuillez réessayer",
    no_merchant_accounts: "Aucun compte Merchant Center trouvé",
    oauth_failed: "Erreur lors de la connexion OAuth",
    save_failed: "Erreur lors de l'enregistrement du compte",
    no_ads_accounts: "Aucun compte Google Ads trouvé",
    no_credentials:
      "Veuillez d'abord configurer vos identifiants Google Cloud ci-dessous avant de connecter un compte.",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comptes connectés</h1>
        <p className="text-muted-foreground">
          Gérez vos identifiants Google Cloud et vos connexions Merchant Center / Google Ads
        </p>
      </div>

      {/* Success message */}
      {params.success && successMessages[params.success] && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Succès</AlertTitle>
          <AlertDescription className="text-green-700">
            {successMessages[params.success]}
          </AlertDescription>
        </Alert>
      )}

      {/* Error message */}
      {params.error && errorMessages[params.error] && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{errorMessages[params.error]}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Google OAuth Credentials */}
      <section className="space-y-4">
        <GoogleCredentialsForm />
      </section>

      {/* Step 2: Merchant Center Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Google Merchant Center</h2>
          </div>
          {hasCredentials && <ConnectMerchantButton />}
        </div>

        {!hasCredentials ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-muted-foreground">
                Configuration requise
              </CardTitle>
              <CardDescription>
                Configurez d&apos;abord vos identifiants Google Cloud ci-dessus pour
                pouvoir connecter un compte Merchant Center.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : merchantAccounts && merchantAccounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {merchantAccounts.map((account) => (
              <MerchantAccountCard key={account.id} account={account} />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Aucun compte connecté</CardTitle>
              <CardDescription>
                Connectez votre compte Google Merchant Center pour commencer à
                optimiser vos titres produits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectMerchantButton />
            </CardContent>
          </Card>
        )}
      </section>

      {/* Step 3: Google Ads Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Google Ads (optionnel)</h2>
          </div>
          {hasCredentials && adsAccounts && adsAccounts.length > 0 && (
            <ConnectGoogleAdsButton />
          )}
        </div>

        {!hasCredentials ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-muted-foreground">
                Configuration requise
              </CardTitle>
              <CardDescription>
                Configurez d&apos;abord vos identifiants Google Cloud pour
                pouvoir connecter un compte Google Ads.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : adsAccounts && adsAccounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {adsAccounts.map((account) => (
              <GoogleAdsAccountCard key={account.id} account={account} />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Métriques des campagnes payantes</CardTitle>
              <CardDescription>
                Connectez Google Ads pour voir les performances de vos campagnes
                Shopping payantes en plus des listings gratuits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectGoogleAdsButton />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
