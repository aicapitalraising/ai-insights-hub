

# Verify & Seed All Clients from API Reference

## Problem
The API reference lists 21 clients with detailed configuration (GHL keys, Meta ad account IDs, funnel pages, calendar IDs, pipeline IDs, etc.). We need to ensure all are present in the database with accurate data across three tables: `clients`, `client_settings`, and `client_funnel_steps`.

## Approach

Build an **admin seeding edge function** (`seed-client-directory`) that upserts all 21 clients and their configuration in one call. This is safer and more maintainable than manual SQL or individual inserts.

### Step 1: Create `seed-client-directory` edge function

A single edge function that:
1. Upserts all 21 clients into the `clients` table (matched by `id`) with fields: `name`, `status`, `slug`, `ghl_location_id`, `ghl_api_key`, `meta_ad_account_id`, `meta_access_token`, `business_manager_url`
2. Upserts corresponding `client_settings` rows (matched by `client_id`) with: `funded_pipeline_id`, `tracked_calendar_ids`, `reconnect_calendar_ids`, `ads_library_url`
3. Syncs `client_funnel_steps` for each client: deletes existing steps, then inserts all funnel pages from the reference with `name`, `url`, `sort_order`

Password-protected using the existing `HPA1234$` pattern.

### Step 2: Add a "Sync Client Directory" button to Settings

Add a button in the existing Settings page (or the API Reference tab) that calls the new edge function. Shows a toast with results.

### Step 3: Call the function to populate data

Trigger the seed to ensure all 21 clients are present and accurate.

## Data to seed (21 clients)

| Client | ID | Status | GHL | Meta |
|---|---|---|---|---|
| Blue Capital | f414feaa... | active | Yes | Yes |
| Blue Metric Group | 0d75a471... | active | Yes | Yes |
| Evia Company | d402676b... | onboarding | Yes | No |
| Freaky Fast Investments | 8689db32... | active | Yes | Yes |
| HPA - AI Capital Raising | 18acd701... | inactive | Yes | Yes |
| HRT | 055eea03... | active | Yes | Yes |
| JJ Dental | 5bffa91b... | active | Yes | Yes |
| Kroh Exploration | d16175f2... | active | Yes | Yes |
| Land Value Alpha | 70a87509... | active | Yes | Yes |
| Lansing Capital | c9d7dc91... | active | Yes | Yes |
| Legacy Capital | 3457607d... | active | Yes | Yes |
| LSCRE | 924aee58... | active | Yes | Yes |
| LSCRE - Leasing | 9bed8162... | active | No | No |
| LSCRE - Hiring | 43dd2062... | active | Yes | No |
| OBL | 268edbc5... | active | Yes | No |
| Paradyme | a5b63280... | active | Yes | Yes |
| Quad J Capital | 098bdcf2... | active | Yes | Yes |
| Simple House Capital | 47b10f07... | active | Yes | Yes |
| Texas State Oil | 6163dbe3... | active | Yes | Yes |
| Think & Grow Rich | 56d833ca... | active | Yes | Yes |
| Titan Management Group | 9b1b0228... | active | Yes | Yes |

Each client also has: funnel pages, tracked/reconnect calendar IDs, funded pipeline IDs, website URLs, ads manager URLs, and ads library URLs where applicable.

## Technical Details

- The edge function uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Upsert on `clients` uses `onConflict: 'id'` to update existing records
- Upsert on `client_settings` uses `onConflict: 'client_id'`
- Funnel steps are delete-and-reinsert per client for simplicity
- The function returns a summary of what was created vs updated
- Config.toml entry: `[functions.seed-client-directory] verify_jwt = false`

