"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface MerchantAccountInfo {
  id: string
  merchant_id: string
  account_name: string | null
  products_count: number
}

export interface AdsAccountInfo {
  id: string
  customer_id: string
  account_name: string | null
  merchant_account_id: string | null
}

interface AccountContextValue {
  merchantAccounts: MerchantAccountInfo[]
  adsAccounts: AdsAccountInfo[]
  selectedMerchantId: string
  setSelectedMerchantId: (id: string) => void
  /** The ads account linked to the currently selected merchant, if any */
  linkedAdsAccount: AdsAccountInfo | null
}

const AccountContext = createContext<AccountContextValue | null>(null)

export function AccountProvider({
  merchantAccounts,
  adsAccounts,
  children,
}: {
  merchantAccounts: MerchantAccountInfo[]
  adsAccounts: AdsAccountInfo[]
  children: ReactNode
}) {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>(
    merchantAccounts[0]?.id || ""
  )

  const linkedAdsAccount =
    adsAccounts.find((a) => a.merchant_account_id === selectedMerchantId) || null

  return (
    <AccountContext.Provider
      value={{
        merchantAccounts,
        adsAccounts,
        selectedMerchantId,
        setSelectedMerchantId,
        linkedAdsAccount,
      }}
    >
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  const ctx = useContext(AccountContext)
  if (!ctx) {
    throw new Error("useAccount must be used within AccountProvider")
  }
  return ctx
}
