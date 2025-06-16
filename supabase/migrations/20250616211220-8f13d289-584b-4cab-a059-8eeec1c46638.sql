
-- הפעלת הרחבות הנדרשות לעבודה עם cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- יצירת cron job שירוץ כל יום שלישי בשעה 13:00 (שעון ישראל)
-- שעה 10:00 UTC = 13:00 בשעון ישראל (חורף)
SELECT cron.schedule(
  'auto-create-toto-round',
  '0 10 * * 2', -- כל יום שלישי בשעה 10:00 UTC (13:00 ישראל)
  $$
  SELECT
    net.http_post(
        url:='https://gplltbkfconqjcyfsnel.supabase.co/functions/v1/auto-create-round',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwbGx0YmtmY29ucWpjeWZzbmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDM0NzIsImV4cCI6MjA2NTU3OTQ3Mn0.w-2tRL_oe8hRIpoTwY-idU1OrPQhD5qIXRQropTN3sU"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- בדיקה שה-cron job נוצר בהצלחה
SELECT * FROM cron.job WHERE jobname = 'auto-create-toto-round';
