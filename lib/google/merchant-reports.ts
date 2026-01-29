import { google } from "googleapis"

interface FreeListingMetric {
  offerId: string
  clicks: number
  impressions: number
}

function getContentClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  return google.content({ version: "v2.1", auth: oauth2Client })
}

export async function getFreeListingsMetrics(
  accessToken: string,
  merchantId: string,
  days: number
): Promise<FreeListingMetric[]> {
  const content = getContentClient(accessToken)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString().split("T")[0]

  const response = await content.reports.search({
    merchantId,
    requestBody: {
      query: `
        SELECT
          segments.offer_id,
          metrics.clicks,
          metrics.impressions
        FROM MerchantPerformanceView
        WHERE segments.date >= '${startDateStr}'
      `,
    },
  })

  const results: FreeListingMetric[] = []
  const metricsMap = new Map<string, FreeListingMetric>()

  if (response.data.results) {
    for (const row of response.data.results) {
      const offerId = row.segments?.offerId || ""
      if (!offerId) continue

      const existing = metricsMap.get(offerId)
      const clicks = Number(row.metrics?.clicks || 0)
      const impressions = Number(row.metrics?.impressions || 0)

      if (existing) {
        existing.clicks += clicks
        existing.impressions += impressions
      } else {
        metricsMap.set(offerId, { offerId, clicks, impressions })
      }
    }
  }

  metricsMap.forEach((metric) => results.push(metric))
  return results
}

export async function getAllFreeListingsMetrics(
  accessToken: string,
  merchantId: string
): Promise<{
  metrics14d: FreeListingMetric[]
  metrics30d: FreeListingMetric[]
  metrics90d: FreeListingMetric[]
  metrics365d: FreeListingMetric[]
}> {
  const [metrics14d, metrics30d, metrics90d, metrics365d] = await Promise.all([
    getFreeListingsMetrics(accessToken, merchantId, 14),
    getFreeListingsMetrics(accessToken, merchantId, 30),
    getFreeListingsMetrics(accessToken, merchantId, 90),
    getFreeListingsMetrics(accessToken, merchantId, 365),
  ])

  return { metrics14d, metrics30d, metrics90d, metrics365d }
}
