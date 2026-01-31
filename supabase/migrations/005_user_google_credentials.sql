-- Per-user Google OAuth credentials
-- Each user stores their own Google Cloud OAuth Client ID and Client Secret
-- These are encrypted at the application level using AES-256-GCM

CREATE TABLE IF NOT EXISTS user_google_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_client_id_encrypted TEXT NOT NULL,
  google_client_secret_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS policies
ALTER TABLE user_google_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credentials"
  ON user_google_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
  ON user_google_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
  ON user_google_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
  ON user_google_credentials FOR DELETE
  USING (auth.uid() = user_id);
