"use client"

import { Button } from "@/components/ui/button"
import { IMPACT_STATUS_LABELS } from "@/lib/constants"

interface TrackingFiltersProps {
  impactStatus: string
  onImpactStatusChange: (status: string) => void
}

const statusOptions = [
  { value: "all", label: "Tous" },
  { value: "pending", label: IMPACT_STATUS_LABELS.pending },
  { value: "positive", label: IMPACT_STATUS_LABELS.positive },
  { value: "neutral", label: IMPACT_STATUS_LABELS.neutral },
  { value: "negative", label: IMPACT_STATUS_LABELS.negative },
]

export function TrackingFilters({
  impactStatus,
  onImpactStatusChange,
}: TrackingFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      {statusOptions.map((option) => (
        <Button
          key={option.value}
          variant={impactStatus === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onImpactStatusChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
