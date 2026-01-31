"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface SyncButtonProps {
  merchantAccountId: string
  onSyncComplete: () => void
}

export function SyncButton({
  merchantAccountId,
  onSyncComplete,
}: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch(`/api/merchant/${merchantAccountId}/sync`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Sync failed")
      }

      const data = await response.json()
      toast.success(`${data.synced} produits synchronisés`)
      onSyncComplete()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur de synchronisation"
      )
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleSync} disabled={syncing}>
      <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Synchronisation..." : "Synchroniser"}
    </Button>
  )
}
