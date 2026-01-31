"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Sparkles, RefreshCw, Loader2, Check, Pencil } from "lucide-react"
import type { Product } from "@/hooks/useProducts"
import type { TitleSuggestion } from "@/lib/claude/prompts"

interface OptimizeModalProps {
  product: Product | null
  merchantAccountId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTitleUpdated: () => void
}

export function OptimizeModal({
  product,
  merchantAccountId,
  open,
  onOpenChange,
  onTitleUpdated,
}: OptimizeModalProps) {
  const [suggestions, setSuggestions] = useState<TitleSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editedTitle, setEditedTitle] = useState("")
  const [manualTitle, setManualTitle] = useState("")

  // Fetch suggestions when modal opens
  useEffect(() => {
    if (open && product) {
      fetchSuggestions()
    }
    if (!open) {
      setSuggestions([])
      setEditingIndex(null)
      setEditedTitle("")
      setManualTitle("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id])

  const fetchSuggestions = async () => {
    if (!product) return
    setLoading(true)
    setSuggestions([])

    try {
      const response = await fetch(
        `/api/merchant/${merchantAccountId}/products/${product.id}/optimize`,
        { method: "POST" }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to generate suggestions")
      }

      const data = await response.json()
      setSuggestions(data.suggestions)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la génération"
      )
    } finally {
      setLoading(false)
    }
  }

  const applyTitle = async (
    title: string,
    reasoning?: string,
    source: string = "ai_suggestion"
  ) => {
    if (!product) return
    setApplying(true)

    try {
      const response = await fetch(
        `/api/merchant/${merchantAccountId}/products/${product.id}/update-title`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newTitle: title,
            aiReasoning: reasoning,
            changeSource: source,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update title")
      }

      toast.success("Titre mis à jour avec succès")
      onOpenChange(false)
      onTitleUpdated()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la mise à jour"
      )
    } finally {
      setApplying(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Optimiser le titre
          </DialogTitle>
          <DialogDescription>
            {product.brand && <span>{product.brand} - </span>}
            {product.price_amount && (
              <span>
                {product.price_amount.toFixed(2)} {product.price_currency}
              </span>
            )}
            {product.google_product_category && (
              <span> - {product.google_product_category}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Current title */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">Titre actuel</Label>
          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            {product.title_current}
          </div>
          {product.title_current !== product.title_original && (
            <p className="text-xs text-muted-foreground">
              Titre original : {product.title_original}
            </p>
          )}
        </div>

        <Separator />

        {/* AI Suggestions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Suggestions IA
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSuggestions}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Regénérer
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border p-4 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-4 space-y-3 hover:border-primary/50 transition-colors"
                >
                  {editingIndex === index ? (
                    // Editing mode
                    <div className="space-y-2">
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        maxLength={150}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {editedTitle.length}/150
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            applyTitle(editedTitle, suggestion.reasoning)
                          }
                          disabled={
                            applying || editedTitle.trim().length === 0
                          }
                        >
                          {applying && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          <Check className="mr-2 h-4 w-4" />
                          Appliquer
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingIndex(null)}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <>
                      <p className="font-medium text-sm">
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {suggestion.reasoning}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.changes.map((change, ci) => (
                          <Badge key={ci} variant="secondary" className="text-xs">
                            {change}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            applyTitle(
                              suggestion.title,
                              suggestion.reasoning
                            )
                          }
                          disabled={applying}
                        >
                          {applying && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Appliquer
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingIndex(index)
                            setEditedTitle(suggestion.title)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Cliquez sur &quot;Regénérer&quot; pour obtenir des suggestions
              </p>
            )
          )}
        </div>

        <Separator />

        {/* Manual title */}
        <div className="space-y-3">
          <Label>Ou saisir manuellement</Label>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Saisir un titre personnalisé..."
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                maxLength={150}
              />
              {manualTitle.length > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                  {manualTitle.length}/150
                </p>
              )}
            </div>
            <Button
              onClick={() => applyTitle(manualTitle, undefined, "manual")}
              disabled={applying || manualTitle.trim().length === 0}
            >
              {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Appliquer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
