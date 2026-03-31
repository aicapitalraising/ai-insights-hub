

# Platform Review — Issues & Improvements

## Overview
After reviewing the full codebase — frontend hooks, edge functions, database schema, auth, sync pipeline, and UI — here are the findings organized by severity.

---

## 1. CRITICAL — Data Accuracy & Sync Reliability

### 1a. `pipelineValue` uses `Math.min` instead of SUM
**File:** `src/hooks/useMetrics.ts` (line 201)
When `defaultLeadPipelineValue` is not set, the fallback calculates pipeline value using `Math.min(...)` of individual lead values — returning the single smallest value instead of the sum. This makes the pipeline KPI wildly wrong for any client without a default configured.
**Fix:** Replace `Math.min(...)` with `.reduce((sum, v) => sum + v, 0)`.

### 1b. `recalculate-daily-metrics` only recalculates yesterday+today by default
**File:** `supabase/functions/recalculate-daily-metrics/index.ts` (lines 41-53)
When called without explicit dates (i.e., from the daily cron), it only processes yesterday and today. Any backdated lead imports, late-arriving GHL data, or manual corrections older than 1 day are never reflected.
**Fix:** Expand default window to 7 days back.

### 1c. `daily-accuracy-check` counts non-spam + null-spam as "expected leads" but daily_metrics stores the same
This is actually consistent now (both count `is_spam=false` + `is_spam IS NULL`). However, the `sync_accuracy_log` insert uses column names (`metric_type`, `expected_count`, `actual_count`) that don't match the table schema (`metric`, `expected_value`, `actual_value`). These inserts silently fail.
**Fix:** Align column names in the accuracy check insert.

### 1d. No retry logic in `sync-ghl-all-clients`
**File:** `supabase/functions/sync-ghl-all-clients/index.ts` (line 55+)
Clients are synced sequentially with no retry. If a single client's GHL API call fails (rate limit, timeout), that client is skipped permanently until the next daily run.
**Fix:** Add 1-retry with exponential backoff per client.

### 1e. Timezone mismatch: frontend local time vs backend UTC
The frontend date filters use local time, but all backend queries use UTC timestamps. Leads appearing on "March 29" in PST may show on "March 30" in the database, causing off-by-one day errors in KPIs.
**Fix:** Ensure date filters send UTC-normalized dates, or adjust queries to account for timezone offset.

---

## 2. HIGH — Security

### 2a. No RLS policies — anon key exposes all 71 tables
Nearly every table has `USING: true / WITH CHECK: true` for the `public` role. The anon key (visible in `db.ts` source code) can read/write leads, clients, funded investors, API keys, etc. This is a serious data exposure risk.
**Fix:** Implement proper RLS with authenticated-only access. Move to Supabase Auth instead of the custom `PasswordGate` localStorage approach.

### 2b. Authentication is localStorage-based
**File:** `src/components/auth/PasswordGate.tsx`
Auth state is stored as `localStorage.setItem('dashboard_auth', 'true')`. Anyone can set this in DevTools to bypass login. The password itself is verified server-side, but the session is purely client-side with no token/JWT.
**Fix:** Use proper Supabase Auth with JWTs; the PasswordGate should verify a real session, not a localStorage flag.

### 2c. Production credentials hardcoded in source
**File:** `src/integrations/supabase/db.ts`
The production Supabase URL and anon key are hardcoded in frontend code committed to the repo. Combined with open RLS, this gives anyone full read/write access.
**Fix:** Move to environment variables; lock down RLS policies first.

---

## 3. MEDIUM — Performance & Architecture

### 3a. `useLeads` auto-refetches every 30 seconds
**File:** `src/hooks/useLeads.ts` (line 52)
Fetches ALL leads (no client filter, no pagination) every 30 seconds. For a growing dataset this is unnecessary load.
**Fix:** Remove `refetchInterval` or add client-scoped filtering.

### 3b. `useMasterSync` polls every 5s with 10-min timeout
**File:** `src/hooks/useMasterSync.ts` (lines 137-167)
Polling is a workaround. The platform already has Realtime subscriptions on the `clients` table — use those instead of polling.
**Fix:** Replace `setInterval` polling with a Supabase Realtime channel subscription on `ghl_sync_status`.

### 3c. `fetchAllRows` sequential pagination
**File:** `src/lib/fetchAllRows.ts`
Pages are fetched sequentially. For 50K+ rows this is slow.
**Fix:** Parallel page fetches or server-side aggregation for large datasets.

### 3d. Cache invalidation scattered across 5+ hooks
`useMasterSync` manually invalidates 10 query keys. Other hooks do their own invalidation. This is fragile and easy to miss.
**Fix:** Centralize cache invalidation into a shared utility.

### 3e. No Error Boundaries
**File:** `src/App.tsx`
No `<ErrorBoundary>` wraps any route. A single component crash takes down the whole app.
**Fix:** Add error boundaries around route groups.

---

## 4. LOW — Code Quality & UX

### 4a. `sync-ghl-contacts` is 3,882 lines
Massive single file. Hard to maintain and debug.
**Fix:** Decompose into modules (contacts, calendar, pipelines, utils).

### 4b. Hardcoded agency client ID in DatabaseView
**File:** Referenced in backlog — a specific client ID is hardcoded.
**Fix:** Make it dynamic based on context.

### 4c. Duplicate/unused pages
`src/pages/` has `BriefsPage.tsx`, `ClientsPage.tsx`, `DashboardPage.tsx`, `LoginPage.tsx`, `SignupPage.tsx`, `SettingsPage.tsx`, `ClientOnboardingPage.tsx` — none of which are in `App.tsx` routes. Dead code.
**Fix:** Remove unused page files.

### 4d. `useSyncHealth` checks `ghl_synced_at` for HubSpot clients
**File:** `src/hooks/useSyncHealth.ts` (line 176+)
The leads query always checks `ghl_synced_at` even for HubSpot-sourced clients. HubSpot leads don't set this field, so sync health always shows "critical" for HubSpot clients.
**Fix:** Check the client's CRM source and query the appropriate sync timestamp.

### 4e. Future-dated daily_metrics rows
The backlog notes `date=2026-12-31` rows exist. No validation prevents inserting metrics for future dates.
**Fix:** Add a validation trigger on `daily_metrics` to reject dates > today + 1.

---

## Recommended Priority Order

1. **Fix `pipelineValue` Math.min bug** — 5 min, immediate accuracy improvement
2. **Expand recalculate-daily-metrics to 7-day lookback** — 10 min
3. **Fix sync_accuracy_log column names** — 5 min
4. **Add Error Boundaries** — 15 min
5. **Fix useSyncHealth for HubSpot** — 10 min
6. **Remove useLeads 30s polling** — 2 min
7. **Replace useMasterSync polling with Realtime** — 30 min
8. **Security hardening (RLS + auth)** — multi-day effort, plan separately

