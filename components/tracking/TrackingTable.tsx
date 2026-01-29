"use client"

import { useState } from "react"
import { TitleChange } from "@/hooks/useTracking"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Clock,
  Undo2,
  ArrowLeft,
  ArrowRight,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { IMPACT_STATUS_LABELS } from "@/lib/constants"

interface TrackingTableProps {
  changes: TitleChange[]
  loading: boolean
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  onRefetch: () => void
}

function ImpactBadge({ status, variation }: { status: string; variation: number | null }) {
  switch (status) {
    case "positive":
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <ArrowUpRight className="mr-1 h-3 w-3" />
          +{variation?.toFixed(1)}%
        </Badge>
      )
    case "negative":
      return (
        <Badge variant="destructive">
          <ArrowDownRight className="mr-1 h-3 w-3" />
          {variation?.toFixed(1)}%
        </Badge>
      )
    case "neutral":
      return (
        <Badge variant="secondary">
          <Minus className="mr-1 h-3 w-3" />
          {variation !== null ? `${variation > 0 ? "+" : ""}${variation?.toFixed(1)}%` : "0%"}
        </Badge>
      )
    case "pending":
    default:
      return (
        <Badge variant="outline">
          <Clock className="mr-1 h-3 w-3" />
          {IMPACT_STATUS_LABELS.pending}
        </Badge>
      )
  }
}

function DaysRemaining({ changedAt }: { changedAt: string }) {
  const changeDate = new Date(changedAt)
  const measureDate = new Date(changeDate)
  measureDate.setDate(measureDate.getDate() + 15)
  const now = new Date()
  const daysLeft = Math.max(
    0,
    Math.ceil((measureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  )

  if (daysLeft === 0) return <span className="text-muted-foreground text-sm">Mesure imminente</span>
  return <span className="text-muted-foreground text-sm">{daysLeft}j restants</span>
}

export function TrackingTable({
  changes,
  loading,
  page,
  totalPages,
  total,
  onPageChange,
  onRefetch,
}: TrackingTableProps) {
  const [rollbackChangeId, setRollbackChangeId] = useState<string | null>(null)
  const [rollbackReason, setRollbackReason] = useState("")
  const [rollingBack, setRollingBack] = useState(false)
  const [detailChange, setDetailChange] = useState<TitleChange | null>(null)

  async function handleRollback() {
    if (!rollbackChangeId) return

    setRollingBack(true)
    try {
      const response = await fetch(`/api/tracking/${rollbackChangeId}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rollbackReason || undefined }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to rollback")
      }

      toast.success("Titre restauré avec succès")
      setRollbackChangeId(null)
      setRollbackReason("")
      onRefetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du rollback")
    } finally {
      setRollingBack(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (changes.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Aucune modification trouvée
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Produit</TableHead>
              <TableHead>Ancien titre</TableHead>
              <TableHead>Nouveau titre</TableHead>
              <TableHead className="text-center">Clics avant</TableHead>
              <TableHead className="text-center">Clics après</TableHead>
              <TableHead className="text-center">Impact</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {changes.map((change) => (
              <TableRow key={change.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {change.products?.image_link ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={change.products.image_link}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {change.products?.brand || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(change.changed_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="max-w-[200px] truncate text-sm" title={change.old_title}>
                    {change.old_title}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="max-w-[200px] truncate text-sm" title={change.new_title}>
                    {change.new_title}
                  </p>
                </TableCell>
                <TableCell className="text-center">
                  {change.total_clicks_before_14d}
                </TableCell>
                <TableCell className="text-center">
                  {change.total_clicks_after_14d !== null
                    ? change.total_clicks_after_14d
                    : "—"}
                </TableCell>
                <TableCell className="text-center">
                  <ImpactBadge
                    status={change.impact_status}
                    variation={change.total_clicks_variation_percent}
                  />
                </TableCell>
                <TableCell className="text-center">
                  {change.impact_status === "pending" ? (
                    <DaysRemaining changedAt={change.changed_at} />
                  ) : change.rolled_back_at ? (
                    <Badge variant="outline" className="text-orange-600">
                      <Undo2 className="mr-1 h-3 w-3" />
                      Annulé
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Mesuré le{" "}
                      {change.measured_at
                        ? new Date(change.measured_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailChange(change)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!change.rolled_back_at && change.impact_status !== "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRollbackChangeId(change.id)}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            {total} modification{total > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Rollback Dialog */}
      <Dialog
        open={!!rollbackChangeId}
        onOpenChange={(open) => {
          if (!open) {
            setRollbackChangeId(null)
            setRollbackReason("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler cette modification ?</DialogTitle>
            <DialogDescription>
              Le titre sera restauré à sa valeur précédente dans Google Merchant Center.
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Raison (optionnel)
            </label>
            <Textarea
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="Pourquoi annuler cette modification ?"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRollbackChangeId(null)
                setRollbackReason("")
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRollback}
              disabled={rollingBack}
            >
              {rollingBack ? "Restauration..." : "Restaurer l'ancien titre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={!!detailChange}
        onOpenChange={(open) => {
          if (!open) setDetailChange(null)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail de la modification</DialogTitle>
          </DialogHeader>
          {detailChange && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ancien titre</p>
                <p className="text-sm">{detailChange.old_title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nouveau titre</p>
                <p className="text-sm">{detailChange.new_title}</p>
              </div>
              {detailChange.ai_reasoning && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Raisonnement IA
                  </p>
                  <p className="text-sm">{detailChange.ai_reasoning}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Source
                  </p>
                  <p className="text-sm">
                    {detailChange.change_source === "ai_suggestion"
                      ? "Suggestion IA"
                      : detailChange.change_source === "manual"
                        ? "Manuel"
                        : detailChange.change_source}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date
                  </p>
                  <p className="text-sm">
                    {new Date(detailChange.changed_at).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="mb-2 text-sm font-medium">Métriques (14 jours)</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">
                      {detailChange.total_clicks_before_14d}
                    </p>
                    <p className="text-xs text-muted-foreground">Clics avant</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {detailChange.total_clicks_after_14d ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Clics après</p>
                  </div>
                  <div>
                    <ImpactBadge
                      status={detailChange.impact_status}
                      variation={detailChange.total_clicks_variation_percent}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Impact</p>
                  </div>
                </div>
              </div>
              {detailChange.rolled_back_at && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <p className="text-sm font-medium text-orange-800">
                    Annulé le{" "}
                    {new Date(detailChange.rolled_back_at).toLocaleDateString("fr-FR")}
                  </p>
                  {detailChange.rollback_reason && (
                    <p className="mt-1 text-sm text-orange-700">
                      {detailChange.rollback_reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
