"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Package,
  BarChart3,
  Link2,
  Settings,
  ShoppingCart,
} from "lucide-react"

const navigation = [
  {
    name: "Produits",
    href: "/products",
    icon: Package,
  },
  {
    name: "Suivi",
    href: "/tracking",
    icon: BarChart3,
  },
  {
    name: "Comptes",
    href: "/accounts",
    icon: Link2,
  },
  {
    name: "Paramètres",
    href: "/settings",
    icon: Settings,
  },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 p-4">
      {navigation.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarLogo() {
  return (
    <div className="flex h-16 items-center gap-2 border-b px-6">
      <ShoppingCart className="h-6 w-6 text-primary" />
      <span className="font-bold">Title Optimizer</span>
    </div>
  )
}

export function Sidebar() {
  return (
    <div className="hidden md:flex h-full w-64 flex-col border-r bg-card">
      <SidebarLogo />
      <NavItems />
    </div>
  )
}

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
      />
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card shadow-lg md:hidden">
        <SidebarLogo />
        <NavItems onNavigate={onClose} />
      </div>
    </>
  )
}
