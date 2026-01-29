"use client"

import { useAccount } from "@/contexts/AccountContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, TrendingUp } from "lucide-react"

export function AccountSelector() {
  const {
    merchantAccounts,
    selectedMerchantId,
    setSelectedMerchantId,
    linkedAdsAccount,
  } = useAccount()

  if (merchantAccounts.length === 0) return null

  return (
    <div className="flex items-center gap-3">
      <Select value={selectedMerchantId} onValueChange={setSelectedMerchantId}>
        <SelectTrigger className="w-[260px]">
          <div className="flex items-center gap-2 truncate">
            <ShoppingCart className="h-4 w-4 shrink-0 text-muted-foreground" />
            <SelectValue placeholder="Sélectionner un compte" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {merchantAccounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center gap-2">
                <span className="truncate">
                  {account.account_name || `MC ${account.merchant_id}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({account.products_count} produits)
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {linkedAdsAccount && (
        <Badge variant="outline" className="shrink-0 gap-1">
          <TrendingUp className="h-3 w-3" />
          Ads lié
        </Badge>
      )}
    </div>
  )
}
