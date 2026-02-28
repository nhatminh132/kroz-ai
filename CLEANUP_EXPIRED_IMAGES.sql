-- Cleanup expired chat images and clear image fields
-- Requires pg_cron extension enabled in Supabase

-- 1) Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2) Create a function to delete expired rows (mark only)
CREATE OR REPLACE FUNCTION cleanup_expired_chat_images()
RETURNS void AS $$
BEGIN
  -- Clear expired image metadata
  UPDATE messages
  SET image_path = NULL,
      image_expires_at = NULL
  WHERE image_expires_at IS NOT NULL
    AND image_expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- 3) Schedule the job to run daily at 2 AM UTC
SELECT cron.schedule(
  'cleanup_expired_chat_images',
  '0 2 * * *',
  $$SELECT cleanup_expired_chat_images();$$
);

-- NOTE: This does NOT delete files from Storage.
-- Supabase Storage deletions must be handled via Edge Function or server-side cleanup.
