-- Fix duplicate GHL sync cron and add missing daily-master-sync schedule
--
-- Problem 1: Two cron jobs both running sync-ghl-all-clients every 2 hours:
--   - 'sync-ghl-all-clients-4h' (was altered to 2h by migration 20260304)
--   - 'sync-ghl-all-clients-2h' (added separately by migration 20260314)
-- Fix: Remove the older 'sync-ghl-all-clients-4h' job; keep 'sync-ghl-all-clients-2h'
--
-- Problem 2: daily-master-sync (Meta Ads, HubSpot, metrics, accuracy) was never scheduled.
-- Fix: Schedule it nightly at 02:00 UTC.

-- Remove duplicate GHL cron (the old 4h job that was mutated to 2h)
SELECT cron.unschedule('sync-ghl-all-clients-4h');

-- Schedule daily-master-sync at 02:00 UTC every day
-- This handles: Meta Ads sync, HubSpot sync, metrics recalculation,
--               daily accuracy check, CPL brief triggers, token expiry alerts
SELECT cron.schedule(
  'daily-master-sync-2am',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jgwwmtuvjlmzapwqiabu.supabase.co/functions/v1/daily-master-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd3dtdHV2amxtemFwd3FpYWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDkzODIsImV4cCI6MjA4MzMyNTM4Mn0.STFrUoif30xXQCjabc3skP6_tTnVIATwHhwWxeZoUr4"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
