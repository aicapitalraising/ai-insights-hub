
# Connect Meta Ads Token and Enable Daily Stats Sync

## Overview
Store the new long-lived Meta access token on all relevant clients, set their shared ad account ID, enhance the sync function to log daily ad stats, and schedule automatic daily syncing.

## What Will Happen

### 1. Connect the Token to All Clients
Store the new Meta access token and ad account ID (`478773718246380`) on the clients that share this ad account:
- Blue Capital
- LSCRE
- Jay More - Human Factors International

(Land Value Alpha was not found as an active client -- if it needs to be added, let me know.)

### 2. Enhance the Sync Function for Daily Stats
The current `sync-meta-ads` function fetches campaigns, ad sets, and ads with 30-day aggregated insights. It will be upgraded to **also fetch day-by-day breakdowns** and write them into the `daily_metrics` table (ad_spend, impressions, clicks, ctr per client per day).

This ensures the dashboard's daily performance table reflects accurate Meta ad spend data alongside CRM metrics.

### 3. Schedule Automatic Daily Sync
Set up a cron job to automatically trigger the sync for each Meta-connected client. This will run every 15 minutes (matching the existing sync cadence from the architecture) to keep the Ads Manager and daily stats current.

---

## Technical Details

### Step 1 -- Database Updates
Run SQL to set `meta_access_token` and `meta_ad_account_id` on the 3 client records:
- Token: the provided long-lived token (expires April 17, 2026)
- Ad Account: `478773718246380`

### Step 2 -- Update `sync-meta-ads` Edge Function
Add a new section after the existing insights fetch that:
- Calls Meta Insights API with `time_increment=1` and `date_preset=last_30d` at the account level
- Upserts each day's `spend`, `impressions`, `clicks`, `ctr` into the `daily_metrics` table using `(client_id, date)` as the conflict key
- Only updates ad-spend columns (preserves lead/call/funded data already in the row)

### Step 3 -- Create Cron Job
Schedule a `pg_cron` + `pg_net` job that calls `sync-meta-ads` for each Meta-enabled client every 15 minutes. The job will query for all clients with a non-null `meta_access_token` and fire the edge function for each.

### Files Changed
- `supabase/functions/sync-meta-ads/index.ts` -- add daily metrics upsert logic
- Database: UPDATE clients table with token + ad account ID
- Database: INSERT cron job for automated sync
