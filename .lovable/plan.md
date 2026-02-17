

# Ads Manager Full-Funnel ROI Attribution

## Overview
Sync leads, calls, and funded investors back into the Ads Manager tab by matching campaign and ad set names from GHL custom fields to Meta campaign/ad set records. Redesign the UI to a clean Cometly-style data table with full ROI metrics. Change the cron to every 4 hours with staggered execution.

## What Changes

### 1. Backfill Lead Attribution Data
513 Blue Capital leads already have campaign and ad set names stored in GHL custom fields (`FnE2fd8OS6GvBhR2oTEy` for campaign, `IiyHAHVhIgVfyv1BSCGx` for ad set). These will be copied into the `campaign_name` and `ad_set_name` columns so they can be matched to Meta records.

LSCRE and Jay More leads don't currently have campaign-level attribution in their custom fields -- they'll be attributed at the account level until UTMs are configured on their ad campaigns.

### 2. Add Attribution Columns to Meta Tables
Add CRM attribution columns to `meta_campaigns`, `meta_ad_sets`, and `meta_ads`:
- `attributed_leads` -- count of leads matched to this campaign/ad set
- `attributed_calls` -- count of booked calls from those leads
- `attributed_showed` -- count of showed calls
- `attributed_funded` -- count of funded investors
- `attributed_funded_dollars` -- total funded amount
- `cost_per_lead` -- spend / leads
- `cost_per_call` -- spend / calls
- `cost_per_funded` -- spend / funded

### 3. Enhance sync-meta-ads Edge Function
After fetching Meta API data, add a new attribution step:
- Query `leads` grouped by `campaign_name` matching `meta_campaigns.name`
- Count calls (via `lead_id` join) and showed calls per campaign
- Count funded investors and sum funded dollars per campaign
- Calculate CPL, cost per call, cost per funded
- Repeat at ad set level using `ad_set_name`
- Upsert these metrics onto the meta tables

### 4. Redesign Ads Manager UI (Cometly-style)
Replace the card-based layout with a clean sortable data table:
- Top bar: title, last sync time, sync button
- Three tabs: Campaigns / Ad Sets / Ads
- Table columns: Name, Status (dot indicator), Budget, Spend, Impressions, CPM, Clicks, CTR, CPC, Leads, CPL, Calls, Showed, Funded, Funded $, CPA
- All columns sortable by clicking header
- Clicking a campaign row filters the Ad Sets tab; clicking an ad set filters Ads
- Compact rows with consistent number formatting ($, %, commas)

### 5. Change Cron to 4-Hour Staggered Schedule
Update the existing cron job from `0 */2 * * *` to `0 */4 * * *`. Add a `pg_sleep(random() * 30)` delay between each client's API call so they don't all hit Meta simultaneously.

---

## Technical Details

### Database Changes

**Lead backfill (data update, not schema):**
```sql
UPDATE leads SET campaign_name = custom_fields->>'FnE2fd8OS6GvBhR2oTEy'
WHERE campaign_name IS NULL
  AND custom_fields->>'FnE2fd8OS6GvBhR2oTEy' IS NOT NULL;

UPDATE leads SET ad_set_name = custom_fields->>'IiyHAHVhIgVfyv1BSCGx'
WHERE ad_set_name IS NULL
  AND custom_fields->>'IiyHAHVhIgVfyv1BSCGx' IS NOT NULL;
```

**Schema migration -- add attribution columns to all 3 meta tables:**
```sql
ALTER TABLE meta_campaigns ADD COLUMN IF NOT EXISTS
  attributed_leads integer DEFAULT 0,
  attributed_calls integer DEFAULT 0,
  attributed_showed integer DEFAULT 0,
  attributed_funded integer DEFAULT 0,
  attributed_funded_dollars numeric DEFAULT 0,
  cost_per_lead numeric DEFAULT 0,
  cost_per_call numeric DEFAULT 0,
  cost_per_funded numeric DEFAULT 0;
-- Same for meta_ad_sets and meta_ads
```

**Cron update (data change):**
```sql
UPDATE cron.job SET schedule = '0 */4 * * *',
command = (staggered version with pg_sleep between clients)
WHERE jobname = 'sync-meta-ads-all-clients';
```

### Edge Function Changes (sync-meta-ads/index.ts)
Add new section after insights fetch:
1. Query leads by client_id, group by campaign_name
2. For each campaign name, match to meta_campaigns.name
3. Join calls via lead_id to count booked/showed
4. Join funded_investors via lead_id for funded count + dollars
5. Calculate cost metrics (CPL = spend / leads, etc.)
6. Update meta_campaigns with attribution data
7. Repeat at ad set level

### UI Changes (AdsManagerTab.tsx)
Complete rewrite to table layout:
- Use horizontal tabs (Campaigns / Ad Sets / Ads) instead of drill-down breadcrumbs
- Sortable table headers with ascending/descending toggle
- Status dot (green = active, yellow = paused, gray = other)
- Right-aligned numeric columns
- Row click on Campaigns tab switches to Ad Sets filtered by that campaign
- Compact, dense row styling matching Cometly reference

### Files Changed
- `supabase/functions/sync-meta-ads/index.ts` -- add CRM attribution aggregation
- `src/components/ads-manager/AdsManagerTab.tsx` -- full UI redesign to table layout
- `src/hooks/useMetaAds.ts` -- no changes needed (queries already return `*`)
- Database: migration for new columns on 3 meta tables
- Database: data updates for lead backfill and cron schedule

