import { google } from "googleapis"

const MERCHANT_SCOPES = ["https://www.googleapis.com/auth/content"]
const ADS_SCOPES = ["https://www.googleapis.com/auth/adwords"]

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
}

export function getMerchantAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client()

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: MERCHANT_SCOPES,
    state,
    prompt: "consent",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI_MERCHANT,
  })
}

export function getAdsAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client()

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ADS_SCOPES,
    state,
    prompt: "consent",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI_ADS,
  })
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string
  refreshToken: string
  expiresAt: Date
}> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
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

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string
  expiresAt: Date
}> {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const { credentials } = await oauth2Client.refreshAccessToken()

  if (!credentials.access_token) {
    throw new Error("Failed to refresh access token")
  }

  const expiresAt = credentials.expiry_date
    ? new Date(credentials.expiry_date)
    : new Date(Date.now() + 3600 * 1000)

  return {
    accessToken: credentials.access_token,
    expiresAt,
  }
}

export async function getUserInfo(accessToken: string): Promise<{
  email: string
  name?: string
}> {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
  const { data } = await oauth2.userinfo.get()

  return {
    email: data.email || "",
    name: data.name || undefined,
  }
}
