"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Separator } from "@/components/ui/separator"
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
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface SettingsPageClientProps {
  profile: {
    full_name: string | null
    email: string
  }
}

export function SettingsPageClient({ profile }: SettingsPageClientProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile.full_name || "")
  const [saving, setSaving] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deleting, setDeleting] = useState(false)

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error("Le nom ne peut pas être vide")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur")
      }

      toast.success("Profil mis à jour")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "SUPPRIMER") {
      toast.error("Tapez SUPPRIMER pour confirmer")
      return
    }

    setDeleting(true)
    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur")
      }

      toast.success("Compte supprimé")
      router.push("/login")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez votre profil et vos préférences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Votre nom"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue={profile.email}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              L&apos;email ne peut pas être modifié
            </p>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
          <CardDescription>
            Actions irréversibles sur votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            La suppression de votre compte est définitive. Toutes vos données,
            comptes connectés et historique seront perdus.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Supprimer mon compte</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Supprimer définitivement votre compte ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Tous vos comptes connectés,
                  produits et historique seront supprimés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-2">
                <Label>
                  Tapez <span className="font-mono font-bold">SUPPRIMER</span>{" "}
                  pour confirmer
                </Label>
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="SUPPRIMER"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => setDeleteConfirmation("")}
                >
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== "SUPPRIMER" || deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Supprimer mon compte
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
