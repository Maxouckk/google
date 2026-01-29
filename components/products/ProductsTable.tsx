"use client"

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
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react"
import type { Product, Period, TrafficSource } from "@/hooks/useProducts"

interface ProductsTableProps {
  products: Product[]
  total: number
  page: number
  totalPages: number
  pageSize: number
  period: Period
  trafficSource: TrafficSource
  loading: boolean
  onPageChange: (page: number) => void
  onOptimize: (product: Product) => void
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  original: { label: "Non optimisé", variant: "outline" },
  testing: { label: "En test", variant: "secondary" },
  optimized: { label: "Optimisé", variant: "default" },
  rolled_back: { label: "Annulé", variant: "destructive" },
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString("fr-FR")
}

function getMetrics(product: Product, period: Period, trafficSource: TrafficSource) {
  const suffix = period

  if (trafficSource === "free") {
    return {
      clicks: product[`free_clicks_${suffix}`] || 0,
      impressions: product[`free_impressions_${suffix}`] || 0,
    }
  }

  if (trafficSource === "ads") {
    return {
      clicks: product[`ads_clicks_${suffix}`] || 0,
      impressions: product[`ads_impressions_${suffix}`] || 0,
    }
  }

  // total
  return {
    clicks: product[`total_clicks_${suffix}`] || 0,
    impressions:
      (product[`free_impressions_${suffix}`] || 0) +
      (product[`ads_impressions_${suffix}`] || 0),
  }
}

const sourceLabels: Record<TrafficSource, string> = {
  total: "Clics",
  free: "Clics (free)",
  ads: "Clics (ads)",
}

export function ProductsTable({
  products,
  total,
  page,
  totalPages,
  pageSize,
  period,
  trafficSource,
  loading,
  onPageChange,
  onOptimize,
}: ProductsTableProps) {
  if (loading) {
    return <ProductsTableSkeleton />
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucun produit trouvé</p>
        <p className="text-sm text-muted-foreground mt-1">
          Synchronisez vos produits depuis la page Comptes
        </p>
      </div>
    )
  }

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Image</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead className="w-[100px] text-right">{sourceLabels[trafficSource]}</TableHead>
              <TableHead className="w-[100px] text-right">Impressions</TableHead>
              <TableHead className="w-[120px]">Statut</TableHead>
              <TableHead className="w-[100px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const metrics = getMetrics(product, period, trafficSource)
              const statusInfo =
                statusConfig[product.optimization_status] || statusConfig.original

              return (
                <TableRow key={product.id}>
                  {/* Image */}
                  <TableCell>
                    {product.image_link ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={product.image_link}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          target.parentElement!.innerHTML =
                            '<div class="flex h-10 w-10 items-center justify-center rounded bg-muted"><svg class="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>'
                        }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>

                  {/* Title */}
                  <TableCell>
                    <div className="max-w-[400px]">
                      <p className="truncate font-medium text-sm">
                        {product.title_current}
                      </p>
                      {product.title_current !== product.title_original && (
                        <p className="truncate text-xs text-muted-foreground line-through">
                          {product.title_original}
                        </p>
                      )}
                      {product.brand && (
                        <p className="text-xs text-muted-foreground">
                          {product.brand}
                          {product.price_amount
                            ? ` - ${product.price_amount.toFixed(2)} ${product.price_currency}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Clicks */}
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatNumber(metrics.clicks)}
                  </TableCell>

                  {/* Impressions */}
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatNumber(metrics.impressions)}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right">
                    {(product.optimization_status === "original" ||
                      product.optimization_status === "optimized") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOptimize(product)}
                      >
                        Optimiser
                      </Button>
                    )}
                    {product.optimization_status === "testing" && (
                      <Button size="sm" variant="ghost" disabled>
                        En test
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {from}-{to} sur {total.toLocaleString("fr-FR")} produits
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProductsTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Image</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead className="w-[100px]">Clics</TableHead>
            <TableHead className="w-[100px]">Impressions</TableHead>
            <TableHead className="w-[120px]">Statut</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-10 w-10 rounded" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[300px]" />
                <Skeleton className="mt-1 h-3 w-[150px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12 ml-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12 ml-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-20 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
