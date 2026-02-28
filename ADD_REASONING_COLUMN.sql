-- Add reasoning column to messages table
-- This allows storing AI reasoning/thinking process with each message

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reasoning TEXT;

-- Add index for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_messages_reasoning ON messages(reasoning) WHERE reasoning IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' AND column_name = 'reasoning';
