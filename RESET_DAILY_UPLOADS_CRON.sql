-- Fix the cron job to use the correct table name

-- First, unschedule the old job (if it exists)
SELECT cron.unschedule('reset-daily-uploads');

-- Create the corrected function
CREATE OR REPLACE FUNCTION reset_daily_uploads()
RETURNS void AS $$
BEGIN
  UPDATE profiles SET uploads_left = 15;
END;
$$ LANGUAGE plpgsql;

-- Schedule the reset to run daily at midnight PST (8 AM UTC)
SELECT cron.schedule(
  'reset-daily-uploads',           -- Job name
  '0 8 * * *',                      -- Cron expression: 8 AM UTC = Midnight PST
  $$
  SELECT reset_daily_uploads();
  $$
);

-- Verify the job is scheduled
SELECT * FROM cron.job;
