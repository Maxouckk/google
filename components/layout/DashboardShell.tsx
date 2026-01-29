"use client"

import { useState } from "react"
import { Sidebar, MobileSidebar } from "./Sidebar"
import { Header } from "./Header"
import {
  AccountProvider,
  type MerchantAccountInfo,
  type AdsAccountInfo,
} from "@/contexts/AccountContext"

interface DashboardShellProps {
  user: {
    email: string
    full_name?: string | null
  }
  merchantAccounts: MerchantAccountInfo[]
  adsAccounts: AdsAccountInfo[]
  children: React.ReactNode
}

export function DashboardShell({
  user,
  merchantAccounts,
  adsAccounts,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <AccountProvider merchantAccounts={merchantAccounts} adsAccounts={adsAccounts}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            user={user}
            onMenuToggle={() => setMobileOpen((prev) => !prev)}
          />
          <main className="flex-1 overflow-auto bg-muted/30 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AccountProvider>
  )
}
