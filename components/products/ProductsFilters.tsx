"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import type { Period } from "@/hooks/useProducts"

interface ProductsFiltersProps {
  period: Period
  onPeriodChange: (period: Period) => void
  status: string
  onStatusChange: (status: string) => void
  search: string
  onSearchChange: (search: string) => void
}

const periods: { value: Period; label: string }[] = [
  { value: "14d", label: "14 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "365d", label: "1 an" },
]

export function ProductsFilters({
  period,
  onPeriodChange,
  status,
  onStatusChange,
  search,
  onSearchChange,
}: ProductsFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Period buttons */}
      <div className="flex items-center gap-1 rounded-lg border p-1">
        {periods.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? "default" : "ghost"}
            size="sm"
            onClick={() => onPeriodChange(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Status filter */}
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="original">Non optimisé</SelectItem>
          <SelectItem value="testing">En test</SelectItem>
          <SelectItem value="optimized">Optimisé</SelectItem>
          <SelectItem value="rolled_back">Annulé</SelectItem>
        </SelectContent>
      </Select>

      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  )
}
