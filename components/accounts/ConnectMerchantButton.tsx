"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function ConnectMerchantButton() {
  return (
    <Button asChild>
      <a href="/api/auth/google/merchant">
        <Plus className="mr-2 h-4 w-4" />
        Connecter un Merchant Center
      </a>
    </Button>
  )
}
