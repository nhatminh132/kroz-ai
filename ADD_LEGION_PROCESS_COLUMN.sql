-- Add legion_process column to messages table for storing Legion multi-agent workflow

-- Add the column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'legion_process'
    ) THEN
        ALTER TABLE messages 
        ADD COLUMN legion_process TEXT;
        
        RAISE NOTICE 'Column legion_process added to messages table';
    ELSE
        RAISE NOTICE 'Column legion_process already exists in messages table';
    END IF;
END $$;

-- Add index for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_messages_legion_process 
ON messages(conversation_id) 
WHERE legion_process IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages' 
AND column_name = 'legion_process';
