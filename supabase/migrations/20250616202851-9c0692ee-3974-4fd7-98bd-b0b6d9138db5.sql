
-- Enable the pg_cron extension to allow scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable the pg_net extension to allow HTTP requests from cron jobs
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job that runs every Tuesday at 10:00 AM (Israel time)
-- This will automatically create a new Toto round and fetch games
SELECT cron.schedule(
  'auto-create-toto-round',
  '0 10 * * 2', -- Every Tuesday at 10:00 AM UTC (13:00 Israel time)
  $$
  SELECT
    net.http_post(
        url:='https://gplltbkfconqjcyfsnel.supabase.co/functions/v1/auto-create-round',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwbGx0YmtmY29ucWpjeWZzbmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDM0NzIsImV4cCI6MjA2NTU3OTQ3Mn0.w-2tRL_oe8hRIpoTwY-idU1OrPQhD5qIXRQropTN3sU"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);
