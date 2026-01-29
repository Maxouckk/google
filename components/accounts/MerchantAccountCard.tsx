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
import { RefreshCw, Trash2, ShoppingCart, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface MerchantAccountCardProps {
  account: {
    id: string
    merchant_id: string
    account_name: string | null
    google_email: string | null
    is_active: boolean
    last_sync_at: string | null
    last_sync_status: string | null
    last_sync_error: string | null
    products_count: number
  }
}

export function MerchantAccountCard({ account }: MerchantAccountCardProps) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch(`/api/merchant/${account.id}/sync`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Sync failed")
      }

      toast.success("Synchronisation terminée")
      router.refresh()
    } catch {
      toast.error("Erreur lors de la synchronisation")
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("merchant_accounts")
        .delete()
        .eq("id", account.id)

      if (error) throw error

      toast.success("Compte déconnecté")
      router.refresh()
    } catch {
      toast.error("Erreur lors de la déconnexion")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {account.account_name || `Compte ${account.merchant_id}`}
            </CardTitle>
            <CardDescription>
              ID: {account.merchant_id}
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
          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Produits: </span>
              <span className="font-medium">{account.products_count}</span>
            </div>
            {account.last_sync_at && (
              <div>
                <span className="text-muted-foreground">
                  Dernière synchro:{" "}
                </span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(account.last_sync_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
            )}
          </div>

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
              disabled={syncing || !account.is_active}
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
                  <AlertDialogTitle>Déconnecter ce compte ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action supprimera la connexion à ce compte Merchant
                    Center. Les données de produits seront conservées mais ne
                    seront plus mises à jour.
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
