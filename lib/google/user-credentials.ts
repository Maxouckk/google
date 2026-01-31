import { createAdminClient } from "@/lib/supabase/admin"
import { decrypt } from "@/lib/encryption"

export interface UserGoogleCredentials {
  clientId: string
  clientSecret: string
}

/**
 * Fetch and decrypt a user's Google OAuth credentials.
 * Throws if the user has not configured their credentials yet.
 */
export async function getUserGoogleCredentials(
  userId: string
): Promise<UserGoogleCredentials> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("user_google_credentials")
    .select("google_client_id_encrypted, google_client_secret_encrypted")
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    throw new Error(
      "Google OAuth non configuré. Veuillez d'abord renseigner vos identifiants Google Cloud dans la page Comptes."
    )
  }

  return {
    clientId: decrypt(data.google_client_id_encrypted),
    clientSecret: decrypt(data.google_client_secret_encrypted),
  }
}
