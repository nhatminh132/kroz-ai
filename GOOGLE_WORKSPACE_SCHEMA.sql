-- Google Workspace Integration Schema
-- Add columns to profiles table for Google Workspace settings

-- Add Google OAuth tokens and settings to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS google_drive_auto_backup BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_drive_folder_id TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_docs_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_keep_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_sheets_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_gmail_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_slides_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_last_backup TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS google_backup_interval INTEGER DEFAULT 3600; -- seconds, default 1 hour

-- Create table for Google Workspace sync history
CREATE TABLE IF NOT EXISTS public.google_sync_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL, -- 'drive', 'calendar', 'docs', 'keep', 'sheets', 'gmail', 'slides'
  action TEXT NOT NULL, -- 'backup', 'export', 'sync', 'email', 'create'
  item_type TEXT, -- 'note', 'flashcard', 'bookmark', 'chat', 'analytics'
  item_id UUID,
  google_resource_id TEXT, -- ID from Google API
  status TEXT NOT NULL, -- 'success', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_google_sync_user_id ON public.google_sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_google_sync_service ON public.google_sync_history(service_type);
CREATE INDEX IF NOT EXISTS idx_google_sync_created ON public.google_sync_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.google_sync_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own Google sync history"
  ON public.google_sync_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google sync history"
  ON public.google_sync_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.google_sync_history IS 'Tracks all Google Workspace API sync operations and their status';
COMMENT ON COLUMN public.profiles.google_access_token IS 'Encrypted Google OAuth access token';
COMMENT ON COLUMN public.profiles.google_refresh_token IS 'Encrypted Google OAuth refresh token';
COMMENT ON COLUMN public.profiles.google_drive_auto_backup IS 'Enable/disable automatic backup to Google Drive';
COMMENT ON COLUMN public.profiles.google_backup_interval IS 'Auto-backup interval in seconds (default 1 hour)';
