-- AI Study Assistant - Safe Schema (won't conflict with existing database)
-- This version checks for existing objects before creating them

-- Enable UUID extension (safe if already exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Only create profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      uploads_left INT DEFAULT 15 NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
    );
    
    -- Enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view their own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);

    CREATE POLICY "Users can update their own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);

    CREATE POLICY "Users can insert their own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  ELSE
    -- Profiles table exists, check if uploads_left column exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'uploads_left'
    ) THEN
      ALTER TABLE profiles ADD COLUMN uploads_left INT DEFAULT 15 NOT NULL;
    END IF;
  END IF;
END $$;

-- Create chat_history table (unique name for this app)
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  model_used TEXT NOT NULL,
  title TEXT, -- For chat renaming feature
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS on chat_history
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own chat history" ON chat_history;
DROP POLICY IF EXISTS "Users can insert their own chat history" ON chat_history;
DROP POLICY IF EXISTS "Users can update their own chat history" ON chat_history;
DROP POLICY IF EXISTS "Users can delete their own chat history" ON chat_history;

-- Create chat_history policies
CREATE POLICY "Users can view their own chat history"
  ON chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat history"
  ON chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat history"
  ON chat_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
  ON chat_history FOR DELETE
  USING (auth.uid() = user_id);

-- Function to handle new user (with unique name to avoid conflicts)
CREATE OR REPLACE FUNCTION public.handle_new_user_ai_study()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    INSERT INTO public.profiles (id, uploads_left)
    VALUES (new.id, 5)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created_ai_study ON auth.users;

-- Create trigger with unique name
CREATE TRIGGER on_auth_user_created_ai_study
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_ai_study();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'AI Study Assistant schema installed successfully!';
  RAISE NOTICE 'Tables created: profiles (shared), chat_history';
  RAISE NOTICE 'Trigger: on_auth_user_created_ai_study';
END $$;
