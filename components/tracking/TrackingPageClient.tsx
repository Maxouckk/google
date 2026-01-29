"use client"

import { useState } from "react"
import { useTracking } from "@/hooks/useTracking"
import { useAccount } from "@/contexts/AccountContext"
import { TrackingTable } from "./TrackingTable"
import { TrackingFilters } from "./TrackingFilters"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BarChart3, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react"

export function TrackingPageClient() {
  const { selectedMerchantId, merchantAccounts } = useAccount()
  const [impactStatus, setImpactStatus] = useState("all")
  const [page, setPage] = useState(1)

  const { changes, total, totalPages, loading, refetch } = useTracking({
    merchantAccountId: selectedMerchantId || undefined,
    impactStatus,
    page,
  })

  // Compute summary stats
  const pendingCount = changes.filter((c) => c.impact_status === "pending").length
  const positiveCount = changes.filter((c) => c.impact_status === "positive").length
  const negativeCount = changes.filter((c) => c.impact_status === "negative").length
  const neutralCount = changes.filter((c) => c.impact_status === "neutral").length

  if (merchantAccounts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Suivi des modifications
          </h1>
          <p className="text-muted-foreground">
            Suivez l&apos;impact de vos optimisations de titres
          </p>
        </div>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Aucun compte connecté</CardTitle>
            <CardDescription>
              Connectez un compte Google Merchant Center pour commencer.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Suivi des modifications
        </h1>
        <p className="text-muted-foreground">
          Suivez l&apos;impact de vos optimisations de titres
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Mesure dans 15 jours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positif</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {positiveCount}
            </div>
            <p className="text-xs text-muted-foreground">
              +10% clics ou plus
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neutre</CardTitle>
            <Minus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{neutralCount}</div>
            <p className="text-xs text-muted-foreground">
              Entre -10% et +10%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Négatif</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {negativeCount}
            </div>
            <p className="text-xs text-muted-foreground">
              -10% clics ou moins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TrackingFilters
        impactStatus={impactStatus}
        onImpactStatusChange={(status) => {
          setImpactStatus(status)
          setPage(1)
        }}
      />

      {/* Table */}
      <TrackingTable
        changes={changes}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onRefetch={refetch}
      />
    </div>
  )
}
