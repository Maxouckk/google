"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  Loader2,
  KeyRound,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react"

interface CredentialsStatus {
  configured: boolean
  maskedClientId?: string
  updatedAt?: string
}

export function GoogleCredentialsForm() {
  const [status, setStatus] = useState<CredentialsStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")

  const appUrl = typeof window !== "undefined" ? window.location.origin : ""

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/credentials")
      const data = await res.json()
      setStatus(data)
      if (!data.configured) {
        setShowForm(true)
      }
    } catch {
      toast.error("Erreur lors de la vérification des identifiants")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error("Veuillez remplir les deux champs")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleClientId: clientId.trim(),
          googleClientSecret: clientSecret.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erreur")
        return
      }

      toast.success("Identifiants Google sauvegardés et chiffrés")
      setClientId("")
      setClientSecret("")
      setShowForm(false)
      fetchStatus()
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={status?.configured ? "border-green-200" : "border-orange-200"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Identifiants Google OAuth</CardTitle>
          </div>
          {status?.configured && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Configuré
            </div>
          )}
        </div>
        <CardDescription>
          {status?.configured
            ? `Client ID : ${status.maskedClientId}`
            : "Configurez vos identifiants Google Cloud pour connecter vos comptes Merchant Center et Google Ads."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Setup guide */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-sm font-medium">
              Comment obtenir vos identifiants Google Cloud ?
            </span>
            {showGuide ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showGuide && (
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              <ol className="list-decimal space-y-2 pl-4">
                <li>
                  Allez sur{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Google Cloud Console
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Créez un projet (ou sélectionnez un projet existant)</li>
                <li>
                  Activez les APIs suivantes dans{" "}
                  <strong>APIs &amp; Services &gt; Library</strong> :
                  <ul className="mt-1 list-disc pl-4">
                    <li>Content API for Shopping</li>
                    <li>Google Ads API (optionnel, pour les métriques Ads)</li>
                  </ul>
                </li>
                <li>
                  Configurez l&apos;écran de consentement OAuth dans{" "}
                  <strong>APIs &amp; Services &gt; OAuth consent screen</strong> :
                  <ul className="mt-1 list-disc pl-4">
                    <li>Type : External</li>
                    <li>
                      Scopes :{" "}
                      <code className="rounded bg-muted px-1 text-xs">
                        .../auth/content
                      </code>{" "}
                      et{" "}
                      <code className="rounded bg-muted px-1 text-xs">
                        .../auth/adwords
                      </code>
                    </li>
                    <li>Ajoutez votre email comme utilisateur test</li>
                  </ul>
                </li>
                <li>
                  Créez des identifiants OAuth dans{" "}
                  <strong>APIs &amp; Services &gt; Credentials &gt; Create Credentials &gt; OAuth client ID</strong>
                </li>
                <li>Type : <strong>Web application</strong></li>
                <li>
                  Ajoutez ces <strong>URI de redirection autorisées</strong> :
                  <div className="mt-1 space-y-1">
                    <code className="block rounded bg-muted px-2 py-1 text-xs break-all">
                      {appUrl}/api/auth/google/merchant/callback
                    </code>
                    <code className="block rounded bg-muted px-2 py-1 text-xs break-all">
                      {appUrl}/api/auth/google/ads/callback
                    </code>
                  </div>
                </li>
                <li>
                  Copiez le <strong>Client ID</strong> et le{" "}
                  <strong>Client Secret</strong> générés ci-dessous
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Security notice */}
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 text-sm">
            Vos identifiants sont chiffrés avec AES-256-GCM avant stockage.
            Ils ne sont jamais exposés en clair.
          </AlertDescription>
        </Alert>

        {/* Form */}
        {(showForm || !status?.configured) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Google Client ID</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="123456-abcdef.apps.googleusercontent.com"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Google Client Secret</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecret ? "text" : "password"}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="GOCSPX-..."
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {status?.configured ? "Mettre à jour" : "Enregistrer"}
              </Button>
              {status?.configured && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false)
                    setClientId("")
                    setClientSecret("")
                  }}
                >
                  Annuler
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Update button when already configured */}
        {status?.configured && !showForm && (
          <Button variant="outline" onClick={() => setShowForm(true)}>
            Modifier les identifiants
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
