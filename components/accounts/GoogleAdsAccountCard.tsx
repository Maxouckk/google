"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RefreshCw, Trash2, TrendingUp, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface GoogleAdsAccountCardProps {
  account: {
    id: string
    customer_id: string
    account_name: string | null
    google_email: string | null
    merchant_account_id: string | null
    is_active: boolean
    last_sync_at: string | null
    last_sync_status: string | null
    last_sync_error: string | null
  }
}

export function GoogleAdsAccountCard({ account }: GoogleAdsAccountCardProps) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch(`/api/ads/${account.id}/sync`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Sync failed")
      }

      toast.success("Synchronisation Ads terminée")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la synchronisation")
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("google_ads_accounts")
        .delete()
        .eq("id", account.id)

      if (error) throw error

      toast.success("Compte Ads déconnecté")
      router.refresh()
    } catch {
      toast.error("Erreur lors de la déconnexion")
    } finally {
      setDeleting(false)
    }
  }

  const isPending = account.customer_id === "pending"

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {account.account_name || `Compte Ads`}
            </CardTitle>
            <CardDescription>
              {isPending ? (
                "Configuration en attente"
              ) : (
                <>ID: {account.customer_id}</>
              )}
              {account.google_email && (
                <>
                  <br />
                  {account.google_email}
                </>
              )}
            </CardDescription>
          </div>
        </div>
        <Badge variant={account.is_active ? "default" : "destructive"}>
          {account.is_active ? "Actif" : "Inactif"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Linked merchant info */}
          {!account.merchant_account_id && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              Aucun compte Merchant Center lié. Connectez un compte Merchant Center pour synchroniser les métriques Ads.
            </div>
          )}

          {/* Last sync */}
          {account.last_sync_at && (
            <div className="text-sm">
              <span className="text-muted-foreground">Dernière synchro: </span>
              <span className="font-medium">
                {formatDistanceToNow(new Date(account.last_sync_at), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
          )}

          {/* Error message */}
          {account.last_sync_error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {account.last_sync_error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing || !account.is_active || isPending}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              Synchroniser
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={deleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Déconnecter
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Déconnecter ce compte Ads ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action supprimera la connexion à ce compte Google Ads.
                    Les métriques Ads ne seront plus mises à jour.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Déconnecter
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
