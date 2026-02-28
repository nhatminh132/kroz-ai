-- Add image storage fields to messages table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'messages'
        AND column_name = 'image_path'
    ) THEN
        ALTER TABLE messages
        ADD COLUMN image_path TEXT,
        ADD COLUMN image_expires_at TIMESTAMP WITH TIME ZONE;

        RAISE NOTICE 'Added image_path and image_expires_at to messages table';
    ELSE
        RAISE NOTICE 'image_path already exists in messages table';
    END IF;
END $$;

-- Optional index for image expiry cleanup queries
CREATE INDEX IF NOT EXISTS idx_messages_image_expires
ON messages(image_expires_at)
WHERE image_expires_at IS NOT NULL;
