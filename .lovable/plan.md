

# Full Sync from Jan 1 2026 + Sync Architecture Audit & Consolidation

## Part 1: Trigger Full Sync Since January 1, 2026

The system already supports historical syncs. We need to:

1. **Invoke `sync-ghl-all-clients` with `sinceDateDays` calculated from Jan 1, 2026 to today** (~80 days). This triggers contacts, calendar appointments, and pipeline syncs for every GHL client.

2. **Invoke `sync-hubspot-all-clients`** for HubSpot clients (same date range).

3. **Invoke `recalculate-daily-metrics`** with `startDate: "2026-01-01"` and `endDate: today` to rebuild all CRM metrics without destroying ad spend data.

4. **Invoke `daily-accuracy-check`** to validate and auto-fix any discrepancies.

We'll add a **"Historical Sync" button** in the Agency Sync Panel that lets admins pick a start date and trigger all of the above as a single operation via a new `full-historical-sync` edge function.

---

## Part 2: Architecture Audit — Issues Found

### Critical Bug: `recalculateHistoricalMetrics` Still Deletes Ad Spend (lines 2782-2794)
The `master_sync` mode calls `recalculateHistoricalMetrics` which **DELETEs all daily_metrics** for a client, then re-inserts rows using plain `insert` (not upsert). This destroys ad_spend/impressions/clicks/ctr data. The `recalculateRecentMetrics` function (line 2954) was already fixed to use upsert, but the historical version was not.

### Redundant Metric Recalculation in 3 Places
Metrics