import { createAdminClient } from "@/lib/supabase/admin"
import { encrypt, decrypt } from "@/lib/encryption"
import { refreshAccessToken } from "./oauth"
import { getUserGoogleCredentials } from "./user-credentials"

const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

export async function getValidAccessToken(
  merchantAccountId: string
): Promise<string> {
  const supabase = createAdminClient()

  const { data: account, error } = await supabase
    .from("merchant_accounts")
    .select("*")
    .eq("id", merchantAccountId)
    .single()

  if (error || !account) {
    throw new Error("Merchant account not found")
  }

  const expiresAt = new Date(account.token_expires_at)
  const now = new Date()

  // Check if token needs refresh
  if (expiresAt.getTime() - now.getTime() < TOKEN_REFRESH_THRESHOLD_MS) {
    const refreshToken = decrypt(account.refresh_token_encrypted)

    // Get user's OAuth credentials for the refresh
    const credentials = await getUserGoogleCredentials(account.user_id)

    try {
      const { accessToken, expiresAt: newExpiresAt } =
        await refreshAccessToken(refreshToken, credentials)

      // Update tokens in database
      await supabase
        .from("merchant_accounts")
        .update({
          access_token_encrypted: encrypt(accessToken),
          token_expires_at: newExpiresAt.toISOString(),
        })
        .eq("id", merchantAccountId)

      return accessToken
    } catch {
      // Mark account as inactive if refresh fails
      await supabase
        .from("merchant_accounts")
        .update({
          is_active: false,
          last_sync_status: "error",
          last_sync_error: "Token refresh failed - please reconnect",
        })
        .eq("id", merchantAccountId)

      throw new Error("Token refresh failed - please reconnect your account")
    }
  }

  return decrypt(account.access_token_encrypted)
}

export async function getValidAdsAccessToken(
  adsAccountId: string
): Promise<string> {
  const supabase = createAdminClient()

  const { data: account, error } = await supabase
    .from("google_ads_accounts")
    .select("*")
    .eq("id", adsAccountId)
    .single()

  if (error || !account) {
    throw new Error("Google Ads account not found")
  }

  const expiresAt = new Date(account.token_expires_at)
  const now = new Date()

  // Check if token needs refresh
  if (expiresAt.getTime() - now.getTime() < TOKEN_REFRESH_THRESHOLD_MS) {
    const refreshToken = decrypt(account.refresh_token_encrypted)

    // Get user's OAuth credentials for the refresh
    const credentials = await getUserGoogleCredentials(account.user_id)

    try {
      const { accessToken, expiresAt: newExpiresAt } =
        await refreshAccessToken(refreshToken, credentials)

      // Update tokens in database
      await supabase
        .from("google_ads_accounts")
        .update({
          access_token_encrypted: encrypt(accessToken),
          token_expires_at: newExpiresAt.toISOString(),
        })
        .eq("id", adsAccountId)

      return accessToken
    } catch {
      // Mark account as inactive if refresh fails
      await supabase
        .from("google_ads_accounts")
        .update({
          is_active: false,
          last_sync_status: "error",
          last_sync_error: "Token refresh failed - please reconnect",
        })
        .eq("id", adsAccountId)

      throw new Error("Token refresh failed - please reconnect your account")
    }
  }

  return decrypt(account.access_token_encrypted)
}
