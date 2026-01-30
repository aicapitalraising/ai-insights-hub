
# Persistent Audit/Troubleshoot Section and Enhanced Journey Labels

## Overview

This plan adds a dedicated **Audit & Troubleshoot** section below the Attribution & Records area to provide persistent visibility into data sync health. It also enhances the timeline journey labels with clearer visual indicators and contextual information.

---

## Current State

1. **Data Discrepancy Banner**: Currently displays as a collapsible alert at the top of the client page when issues exist, but disappears when there are no discrepancies. Users have no persistent view to proactively audit data integrity.

2. **Timeline Labels**: The existing timeline shows events like "Lead Created", "Call - Booked", "Funded $X" but lacks:
   - Data source indicators (webhook vs API sync)
   - Clear funnel stage progression labels
   - Visual journey completeness status

---

## Proposed Solution

### Part 1: Persistent Audit & Troubleshoot Section

Add a new section below "Detailed Records" in the Attribution & Records tab that is always visible:

```text
+-----------------------------------------------------------+
|  Audit & Troubleshoot                           [Refresh] |
+-----------------------------------------------------------+
|                                                           |
|  Sync Health Summary                                      |
|  +-----------------------------------------------------+  |
|  | Last Sync    | Status      | Records    | Gap       |  |
|  +-----------------------------------------------------+  |
|  | Leads        | 12m ago     | 245        | 0         |  |
|  | Calls        | 2h ago      | 89         | 0         |  |
|  | Funded       | 1d ago      | 12         | 0         |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  Active Discrepancies (0)        [Show Resolved History]  |
|  +-----------------------------------------------------+  |
|  | No active data discrepancies detected               |  |
|  | or: List of issues with Review/Acknowledge/Resolve  |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  Quick Checks                                             |
|  +-----------------------------------------------------+  |
|  | Leads without webhooks: 3     [Review]              |  |
|  | Calls missing lead link: 5    [Review]              |  |
|  | Funded without lead: 1        [Review]              |  |
|  +-----------------------------------------------------+  |
|                                                           |
+-----------------------------------------------------------+
```

**Features:**
- Sync health summary showing last sync times for each record type
- Active discrepancies list (integrated from existing `DataDiscrepancyBanner` logic)
- Quick diagnostic checks for data integrity issues
- Toggle to show resolved discrepancy history

### Part 2: Enhanced Journey Labels

Update the timeline visualization in `InlineRecordsView.tsx` to include:

1. **Funnel Stage Indicators**: Clear badges showing progression
   - Lead Created
   - Call Booked
   - Call Confirmed
   - Showed / No Show
   - Committed
   - Funded

2. **Data Source Labels**: Small indicator showing origin
   - Webhook icon for real-time ingestion
   - API icon for sync-sourced records

3. **Journey Completeness Bar**: Visual progress indicator

```text
Timeline (Full Journey)
-----------------------
Lead → Booked → Showed → Funded

[Webhook] Lead Created              Jan 15, 2025 2:30 PM
          Source: Facebook • Campaign: Q1 Accredited

[Webhook] Call Booked               Jan 15, 2025 3:15 PM
          Scheduled: Jan 17, 2025 10:00 AM

[API]     Call - Showed             Jan 17, 2025 10:00 AM
          Duration: 45 min • Quality: 8/10

[Webhook] Funded $50,000            Jan 25, 2025 11:00 AM
          Time to Fund: 10 days • Calls: 2
```

---

## Technical Implementation

### New Files

| File | Purpose |
|------|---------|
| `src/components/dashboard/DataAuditSection.tsx` | Main audit/troubleshoot component |
| `src/hooks/useSyncHealth.ts` | Hook to fetch sync status for each record type |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/ClientDetail.tsx` | Add DataAuditSection below InlineRecordsView in records tab |
| `src/components/dashboard/InlineRecordsView.tsx` | Enhance timeline with data source labels and journey stage badges |
| `src/hooks/useDataDiscrepancies.ts` | Add query for resolved discrepancies history |

---

## Detailed Component Design

### DataAuditSection.tsx

```text
Props:
  - clientId: string
  - leads: Lead[]
  - calls: Call[]
  - fundedInvestors: FundedInvestor[]

Sections:
  1. Sync Health Grid
     - Last webhook log per type
     - Last API sync timestamp from client_settings
     - Record counts with comparison

  2. Active Discrepancies
     - Integrates existing useDataDiscrepancies hook
     - Shows Review Gap modal
     - Acknowledge/Resolve actions

  3. Quick Checks
     - Leads where external_id starts with 'wh_' but no webhook log
     - Calls with null lead_id
     - Funded investors with null lead_id
```

### Timeline Enhancement

Update the timeline event interface:

```typescript
interface TimelineEvent {
  date: string;
  label: string;
  type: 'lead' | 'call' | 'funded' | 'adspend';
  color: string;
  isCurrentRecord?: boolean;
  details?: string | null;
  // NEW fields
  dataSource: 'webhook' | 'api' | 'manual';
  stage?: 'lead' | 'booked' | 'confirmed' | 'showed' | 'no_show' | 'committed' | 'funded';
  stageIndex?: number; // for progress bar
}
```

Add journey progress indicator above timeline:

```text
Lead ────●──── Booked ────●──── Showed ────○──── Funded
                                  ↑ Current Stage
```

---

## Database Queries

### Sync Health Query
```sql
-- Get last sync timestamps
SELECT 
  'leads' as record_type,
  COUNT(*) as count,
  MAX(ghl_synced_at) as last_synced
FROM leads 
WHERE client_id = $1

UNION ALL

SELECT 
  'calls' as record_type,
  COUNT(*) as count,
  MAX(ghl_synced_at) as last_synced
FROM calls 
WHERE client_id = $1
```

### Quick Check Queries
```sql
-- Leads without webhook match
SELECT COUNT(*) FROM leads 
WHERE client_id = $1 
  AND external_id NOT LIKE 'wh_%'
  AND NOT EXISTS (
    SELECT 1 FROM webhook_logs 
    WHERE webhook_logs.client_id = leads.client_id
      AND webhook_logs.webhook_type = 'lead'
      AND webhook_logs.payload->>'contact_id' = leads.external_id
  )

-- Calls missing lead link
SELECT COUNT(*) FROM calls 
WHERE client_id = $1 AND lead_id IS NULL

-- Funded without lead
SELECT COUNT(*) FROM funded_investors 
WHERE client_id = $1 AND lead_id IS NULL
```

---

## UI/UX Details

### Color Coding
- Green: Healthy (synced within 1 hour)
- Yellow: Stale (synced 1-24 hours ago)
- Red: Critical (synced over 24 hours ago or never)

### Data Source Icons
- Webhook: Lightning bolt icon (real-time)
- API: Refresh arrows icon (synced)
- Manual: Pencil icon (manually added)

### Stage Badges
Using existing color scheme from `getCallStatusLabel`:
- Lead: `bg-chart-1` (blue)
- Booked: `bg-chart-3` (green)
- Confirmed: `bg-chart-4` (yellow)
- Showed: `bg-chart-2` (teal)
- No Show: `bg-destructive` (red)
- Funded: `bg-primary` (purple)

---

## Summary of Changes

1. **New Component**: `DataAuditSection.tsx` - Persistent audit panel with sync health, discrepancies, and quick checks
2. **New Hook**: `useSyncHealth.ts` - Fetches aggregated sync status data
3. **ClientDetail.tsx**: Add new section in the records tab
4. **InlineRecordsView.tsx**: Enhance timeline with data source labels, stage badges, and journey progress bar
5. **useDataDiscrepancies.ts**: Add resolved history query option

This implementation provides agencies with continuous visibility into data integrity while making record journeys clearer through explicit funnel stage labeling and data source indicators.
