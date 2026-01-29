"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function ConnectGoogleAdsButton() {
  return (
    <Button variant="outline" asChild>
      <a href="/api/auth/google/ads">
        <Plus className="mr-2 h-4 w-4" />
        Connecter Google Ads
      </a>
    </Button>
  )
}
