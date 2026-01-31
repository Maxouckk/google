import { google } from "googleapis"

const MERCHANT_SCOPES = ["https://www.googleapis.com/auth/content"]
const ADS_SCOPES = ["https://www.googleapis.com/auth/adwords"]

export interface OAuthClientCredentials {
  clientId: string
  clientSecret: string
}

function getOAuth2Client(credentials: OAuthClientCredentials) {
  return new google.auth.OAuth2(credentials.clientId, credentials.clientSecret)
}

export function getMerchantAuthUrl(
  state: string,
  credentials: OAuthClientCredentials
): string {
  const oauth2Client = getOAuth2Client(credentials)

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: MERCHANT_SCOPES,
    state,
    prompt: "consent",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/merchant/callback`,
  })
}

export function getAdsAuthUrl(
  state: string,
  credentials: OAuthClientCredentials
): string {
  const oauth2Client = getOAuth2Client(credentials)

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ADS_SCOPES,
    state,
    prompt: "consent",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/ads/callback`,
  })
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  credentials: OAuthClientCredentials
): Promise<{
  accessToken: string
  refreshToken: string
  expiresAt: Date
}> {
  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    redirectUri
  )

  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Failed to get tokens from Google")
  }

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 3600 * 1000)

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
  }
}

export async function refreshAccessToken(
  refreshToken: string,
  credentials: OAuthClientCredentials
): Promise<{
  accessToken: string
  expiresAt: Date
}> {
  const oauth2Client = getOAuth2Client(credentials)
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const { credentials: newCreds } = await oauth2Client.refreshAccessToken()

  if (!newCreds.access_token) {
    throw new Error("Failed to refresh access token")
  }

  const expiresAt = newCreds.expiry_date
    ? new Date(newCreds.expiry_date)
    : new Date(Date.now() + 3600 * 1000)

  return {
    accessToken: newCreds.access_token,
    expiresAt,
  }
}

export async function getUserInfo(
  accessToken: string,
  credentials: OAuthClientCredentials
): Promise<{
  email: string
  name?: string
}> {
  const oauth2Client = getOAuth2Client(credentials)
  oauth2Client.setCredentials({ access_token: accessToken })

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
  const { data } = await oauth2.userinfo.get()

  return {
    email: data.email || "",
    name: data.name || undefined,
  }
}
