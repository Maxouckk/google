// API Rate limits
export const GOOGLE_CONTENT_API_RATE_LIMIT = 50 // requests per second
export const GOOGLE_REPORTS_API_DAILY_LIMIT = 500 // requests per day

// Pagination
export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 250

// Title constraints
export const TITLE_MAX_LENGTH = 150
export const TITLE_RECOMMENDED_LENGTH = 70

// Impact measurement
export const IMPACT_MEASUREMENT_DAYS = 15
export const POSITIVE_IMPACT_THRESHOLD = 10 // +10%
export const NEGATIVE_IMPACT_THRESHOLD = -10 // -10%

// OAuth scopes
export const GOOGLE_MERCHANT_SCOPES = [
  "https://www.googleapis.com/auth/content",
]

export const GOOGLE_ADS_SCOPES = [
  "https://www.googleapis.com/auth/adwords",
]

// Period options for metrics
export const PERIOD_OPTIONS = [
  { value: "14d", label: "14 jours", days: 14 },
  { value: "30d", label: "30 jours", days: 30 },
  { value: "90d", label: "90 jours", days: 90 },
  { value: "365d", label: "1 an", days: 365 },
] as const

// Optimization status labels
export const OPTIMIZATION_STATUS_LABELS = {
  original: "Non optimisé",
  testing: "En test",
  optimized: "Optimisé",
  rolled_back: "Annulé",
} as const

// Impact status labels
export const IMPACT_STATUS_LABELS = {
  pending: "En attente",
  positive: "Positif",
  neutral: "Neutre",
  negative: "Négatif",
} as const

// Claude model
export const CLAUDE_MODEL = "claude-sonnet-4-20250514"
