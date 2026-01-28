
# Manual Sync Per Row Feature Plan

## Overview
Add per-row manual sync capabilities for leads and calls in the `InlineRecordsView` component. Each row will show:
1. **Last Synced timestamp** - When this record was last synced with GHL
2. **GHL Contact Link** - Quick icon to jump directly to the contact in GHL (already partially exists)
3. **Manual Sync Button** - Refresh individual record data from GHL on demand

---

## Current State Analysis

### Existing Infrastructure
- **GHL Link**: Already implemented via `getGHLContactUrl()` function for leads/calls with valid `external_id`
- **Calls Table**: Has `ghl_synced_at` column for tracking sync timestamps
- **Leads Table**: Missing `ghl_synced_at` column - needs migration
- **Sync Function**: `sync-ghl-contacts` edge function handles bulk syncing but not single-contact refresh

### Database Schema Changes Needed
| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| leads | ghl_synced_at | timestamp with time zone | Track when lead was last synced from GHL |

---

## Implementation Plan

### Phase 1: Database Migration
Add `ghl_synced_at` column to leads table:

```sql
ALTER TABLE public.leads 
ADD COLUMN ghl_synced_at TIMESTAMP WITH TIME ZONE;
```

### Phase 2: Edge Function - Single Contact Sync
Create or extend edge function to support single-contact sync mode:

**Endpoint**: `sync-ghl-contacts` with new parameter `contactId`

**Request Body**:
```json
{
  "clientId": "uuid",
  "contactId": "ghl_external_id",  // NEW - single contact mode
  "mode": "single"                  // NEW - skip bulk processing
}
```

**Response**:
```json
{
  "success": true,
  "contact": {
    "id": "lead_uuid",
    "name": "Updated Name",
    "ghl_synced_at": "2026-01-28T..."
  }
}
```

### Phase 3: React Hook - useSingleContactSync
Create a custom hook for per-row sync operations:

```typescript
// src/hooks/useSingleContactSync.ts
export function useSingleContactSync() {
  const queryClient = useQueryClient();
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  const syncContact = async (clientId: string, externalId: string, recordType: 'lead' | 'call') => {
    setSyncingIds(prev => new Set(prev).add(externalId));
    try {
      const { data, error } = await supabase.functions.invoke('sync-ghl-contacts', {
        body: { clientId, contactId: externalId, mode: 'single' }
      });
      if (error) throw error;
      
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['leads', clientId] });
      queryClient.invalidateQueries({ queryKey: ['calls', clientId] });
      
      toast.success('Contact synced from GHL');
      return data;
    } finally {
      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(externalId);
        return next;
      });
    }
  };

  return { syncContact, syncingIds, isSyncing: (id: string) => syncingIds.has(id) };
}
```

### Phase 4: UI Components - InlineRecordsView Updates

#### 4a. New Table Columns
Add to both Leads and Calls table headers:

| New Column | Width | Content |
|------------|-------|---------|
| Last Sync | 80px | Relative timestamp (e.g., "2h ago") |
| Sync | 40px | Refresh icon button |

#### 4b. Lead Row Enhancement
```text
| Date | Name | Email | ... | GHL | Last Sync | Sync | Actions |
|------|------|-------|-----|-----|-----------|------|---------|
| 1/27 | John | j@... | ... | [↗] | 2h ago    | [⟳] | [✎][🗑] |
```

- **GHL Column**: Existing external link icon (↗)
- **Last Sync Column**: Shows `ghl_synced_at` as relative time ("2h ago", "Never")
- **Sync Column**: RefreshCw icon button that triggers single-contact sync

#### 4c. Call Row Enhancement
Same pattern as leads, using existing `ghl_synced_at` from calls table.

#### 4d. Visual States
- **Syncing**: Spinning RefreshCw icon with disabled state
- **Never Synced**: Gray text "Never"
- **Recently Synced**: Green checkmark + time
- **Stale (>24h)**: Orange/yellow indicator

### Phase 5: Tooltip Enhancement
Hover over "Last Sync" shows full details:
- Full timestamp
- Source of last update (webhook vs GHL sync)
- GHL contact ID for debugging

---

## Component Changes Summary

### Files to Modify:
1. **`supabase/functions/sync-ghl-contacts/index.ts`**
   - Add single-contact sync mode
   - Return updated contact data
   - Update `ghl_synced_at` on both leads and calls

2. **`src/hooks/useLeadsAndCalls.ts`**
   - Add `ghl_synced_at` to Lead interface

3. **`src/hooks/useSingleContactSync.ts`** (NEW)
   - Hook for triggering single-contact sync

4. **`src/components/dashboard/InlineRecordsView.tsx`**
   - Add Last Sync and Sync columns to lead table
   - Add Sync column to call tables
   - Integrate `useSingleContactSync` hook
   - Add loading states for sync buttons

### Database Migration:
- Add `ghl_synced_at` to `leads` table

---

## User Experience Flow

```text
1. User views Leads tab in InlineRecordsView
2. Each row shows:
   - GHL icon (↗) → Opens contact in GHL in new tab
   - "Last Sync" → "3h ago" or "Never"  
   - Sync button (⟳) → Triggers refresh

3. User clicks Sync button:
   - Button shows spinning animation
   - Edge function fetches latest from GHL
   - Row updates with new data
   - Toast confirms "Contact synced from GHL"
   - Last Sync updates to "Just now"
```

---

## Technical Details

### Edge Function Single-Contact Logic
When `contactId` is provided:
1. Skip pagination/batch fetching
2. Fetch single contact: `GET /contacts/{contactId}`
3. Update lead record with latest GHL data
4. Update `ghl_synced_at = now()`
5. Return updated record

### GHL API Call
```typescript
const contact = await fetch(
  `${GHL_BASE_URL}/contacts/${contactId}`,
  { headers: { Authorization: `Bearer ${apiKey}` } }
);
```

### Sync Button Visibility Rules
Only show sync button when:
- `external_id` exists AND
- `external_id` doesn't start with `wh_` or `manual-` AND
- `ghlLocationId` is configured for client

---

## Estimated Changes

| Component | Lines of Code |
|-----------|---------------|
| Database Migration | ~5 |
| Edge Function Update | ~80 |
| New Hook | ~50 |
| InlineRecordsView Updates | ~100 |
| **Total** | **~235 lines** |

