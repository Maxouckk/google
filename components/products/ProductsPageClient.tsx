"use client"

import { useState, useCallback } from "react"
import { useProducts, type Period, type Product } from "@/hooks/useProducts"
import { ProductsTable } from "./ProductsTable"
import { ProductsFilters } from "./ProductsFilters"
import { SyncButton } from "./SyncButton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface MerchantAccount {
  id: string
  account_name: string | null
  products_count: number
}

interface ProductsPageClientProps {
  merchantAccounts: MerchantAccount[]
}

export function ProductsPageClient({
  merchantAccounts,
}: ProductsPageClientProps) {
  const [selectedAccount, setSelectedAccount] = useState<string>(
    merchantAccounts[0]?.id || ""
  )
  const [period, setPeriod] = useState<Period>("30d")
  const [status, setStatus] = useState("all")
  const [search, setSearch] = useState("")
  const [searchDebounced, setSearchDebounced] = useState("")
  const [page, setPage] = useState(1)

  const { products, total, totalPages, loading, refetch } = useProducts({
    merchantAccountId: selectedAccount || undefined,
    period,
    status,
    search: searchDebounced,
    page,
  })

  // Debounce search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      const timeout = setTimeout(() => {
        setSearchDebounced(value)
        setPage(1)
      }, 300)
      return () => clearTimeout(timeout)
    },
    []
  )

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod)
    setPage(1)
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    setPage(1)
  }

  const handleOptimize = (product: Product) => {
    // TODO: Open optimize modal (Phase 4)
    toast.info(`Optimisation de "${product.title_current}" - bientôt disponible`)
  }

  if (merchantAccounts.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-lg font-medium">Aucun compte connecté</p>
        <p className="mt-1 text-muted-foreground">
          Connectez un compte Google Merchant Center pour voir vos produits.
        </p>
        <a href="/dashboard/accounts" className="mt-4 inline-block text-primary hover:underline">
          Aller dans Comptes
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with account selector and sync */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {merchantAccounts.length > 1 && (
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Sélectionner un compte" />
            </SelectTrigger>
            <SelectContent>
              {merchantAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.account_name || "Compte"} ({account.products_count}{" "}
                  produits)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedAccount && (
          <SyncButton
            merchantAccountId={selectedAccount}
            onSyncComplete={refetch}
          />
        )}
      </div>

      {/* Filters */}
      <ProductsFilters
        period={period}
        onPeriodChange={handlePeriodChange}
        status={status}
        onStatusChange={handleStatusChange}
        search={search}
        onSearchChange={handleSearchChange}
      />

      {/* Table */}
      <ProductsTable
        products={products}
        total={total}
        page={page}
        totalPages={totalPages}
        pageSize={50}
        period={period}
        loading={loading}
        onPageChange={setPage}
        onOptimize={handleOptimize}
      />
    </div>
  )
}
