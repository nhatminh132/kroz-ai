-- Add image support columns to messages table
-- Run this in your Supabase SQL Editor

-- Add image_path column (stores path to image in Supabase Storage)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Add image_expires_at column (stores when the signed URL expires)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS image_expires_at TIMESTAMPTZ;

-- Add index for faster queries on image_path
CREATE INDEX IF NOT EXISTS idx_messages_image_path ON messages(image_path);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('image_path', 'image_expires_at');
