import { google } from "googleapis"

interface AdsMetric {
  offerId: string
  clicks: number
  impressions: number
  costMicros: number
  conversions: number
}

interface AdsCustomerAccount {
  customerId: string
  descriptiveName: string
}

function getAdsClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({ access_token: accessToken })
  return oauth2Client
}

/**
 * List accessible Google Ads customer accounts
 */
export async function listAdsCustomerAccounts(
  accessToken: string
): Promise<AdsCustomerAccount[]> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!developerToken) {
    throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN is not configured")
  }

  // Use the Google Ads API REST endpoint to list accessible customers
  const response = await fetch(
    "https://googleads.googleapis.com/v16/customers:listAccessibleCustomers",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("List customers error:", errorText)
    throw new Error("Failed to list Google Ads accounts")
  }

  const data = await response.json()
  const resourceNames: string[] = data.resourceNames || []

  const accounts: AdsCustomerAccount[] = []

  for (const resourceName of resourceNames) {
    const customerId = resourceName.replace("customers/", "")
    try {
      const accountInfo = await getAdsAccountInfo(accessToken, customerId)
      accounts.push(accountInfo)
    } catch {
      // May not have access to all listed accounts
      accounts.push({ customerId, descriptiveName: `Account ${customerId}` })
    }
  }

  return accounts
}

/**
 * Get basic info about a Google Ads customer account
 */
async function getAdsAccountInfo(
  accessToken: string,
  customerId: string
): Promise<AdsCustomerAccount> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!developerToken) {
    throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN is not configured")
  }

  const query = `SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1`

  const response = await fetch(
    `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get account info for ${customerId}`)
  }

  const data = await response.json()
  const results = data[0]?.results || []
  const customer = results[0]?.customer

  return {
    customerId: customer?.id || customerId,
    descriptiveName: customer?.descriptiveName || `Account ${customerId}`,
  }
}

/**
 * Get Shopping campaign metrics from Google Ads
 */
export async function getAdsShoppingMetrics(
  accessToken: string,
  customerId: string,
  days: number
): Promise<AdsMetric[]> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!developerToken) {
    throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN is not configured")
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString().split("T")[0]
  const endDateStr = new Date().toISOString().split("T")[0]

  // Query Shopping campaign performance by product (offer_id)
  const query = `
    SELECT
      shopping_product.offer_id,
      metrics.clicks,
      metrics.impressions,
      metrics.cost_micros,
      metrics.conversions
    FROM shopping_product_performance_view
    WHERE segments.date BETWEEN '${startDateStr}' AND '${endDateStr}'
  `

  const response = await fetch(
    `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Ads metrics error:", errorText)
    throw new Error("Failed to fetch Google Ads metrics")
  }

  const data = await response.json()
  const metricsMap = new Map<string, AdsMetric>()

  for (const batch of data) {
    const results = batch.results || []
    for (const row of results) {
      const offerId = row.shoppingProduct?.offerId || ""
      if (!offerId) continue

      const clicks = Number(row.metrics?.clicks || 0)
      const impressions = Number(row.metrics?.impressions || 0)
      const costMicros = Number(row.metrics?.costMicros || 0)
      const conversions = Number(row.metrics?.conversions || 0)

      const existing = metricsMap.get(offerId)
      if (existing) {
        existing.clicks += clicks
        existing.impressions += impressions
        existing.costMicros += costMicros
        existing.conversions += conversions
      } else {
        metricsMap.set(offerId, {
          offerId,
          clicks,
          impressions,
          costMicros,
          conversions,
        })
      }
    }
  }

  return Array.from(metricsMap.values())
}

/**
 * Get all Ads metrics for standard periods
 */
export async function getAllAdsMetrics(
  accessToken: string,
  customerId: string
): Promise<{
  metrics14d: AdsMetric[]
  metrics30d: AdsMetric[]
  metrics90d: AdsMetric[]
  metrics365d: AdsMetric[]
}> {
  const [metrics14d, metrics30d, metrics90d, metrics365d] = await Promise.all([
    getAdsShoppingMetrics(accessToken, customerId, 14),
    getAdsShoppingMetrics(accessToken, customerId, 30),
    getAdsShoppingMetrics(accessToken, customerId, 90),
    getAdsShoppingMetrics(accessToken, customerId, 365),
  ])

  return { metrics14d, metrics30d, metrics90d, metrics365d }
}

// Re-export for use by the auth module
export { getAdsClient }
