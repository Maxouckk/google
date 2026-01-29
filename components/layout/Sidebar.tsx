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
    href: "/dashboard/products",
    icon: Package,
  },
  {
    name: "Suivi",
    href: "/dashboard/tracking",
    icon: BarChart3,
  },
  {
    name: "Comptes",
    href: "/dashboard/accounts",
    icon: Link2,
  },
  {
    name: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <ShoppingCart className="h-6 w-6 text-primary" />
        <span className="font-bold">Title Optimizer</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
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
    </div>
  )
}
