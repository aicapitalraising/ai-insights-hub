
-- Add hourly cron job for calendar appointment sync across all clients
SELECT cron.schedule(
  'hourly-calendar-sync',
  '15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jgwwmtuvjlmzapwqiabu.supabase.co/functions/v1/sync-calendar-appointments',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd3dtdHV2amxtemFwd3FpYWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDkzODIsImV4cCI6MjA4MzMyNTM4Mn0.STFrUoif30xXQCjabc3skP6_tTnVIATwHhwWxeZoUr4"}'::jsonb,
    body := concat('{"clientId":"', id::text, '"}')::jsonb
  ) AS request_id
  FROM clients
  WHERE status = 'active'
    AND ghl_api_key IS NOT NULL
    AND ghl_location_id IS NOT NULL
    AND id IN (
      SELECT client_id FROM client_settings
      WHERE (tracked_calendar_ids IS NOT NULL AND array_length(tracked_calendar_ids, 1) > 0)
         OR (reconnect_calendar_ids IS NOT NULL AND array_length(reconnect_calendar_ids, 1) > 0)
    );
  $$
);
