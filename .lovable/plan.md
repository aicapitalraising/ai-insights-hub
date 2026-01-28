
# GHL Contact Integration in Record Details

## Overview
This plan implements comprehensive GHL contact integration in the Record Details panel, ensures congruent lead matching across all funnel stages, adds GHL notes storage, filters out incomplete booked calls, and improves funded investor date accuracy.

---

## User Request Breakdown

| Request | Solution |
|---------|----------|
| GHL link & last sync in Record Details | Add GHL Integration section to detail panel |
| Congruent leads across funnel stages | Link calls/funded via `lead_id` or `external_id` matching |
| Pull all GHL contact info and notes | New `ghl_notes` column + edge function enhancement |
| Booked calls need name/phone/email | Filter calls in UI to only show those with linked lead contact info |
| Remove empty booked calls | Add validation during display (not deletion) |
| Sync accurate calls for Jan 2026+ | Already implemented via GHL sync |
| Funded investors from pipeline stages | Enhanced date extraction using `lastStageChangeAt` or `dateUpdated` |

---

## Implementation Details

### Phase 1: Database Migration
Add `ghl_notes` column to store notes synced from GHL:

```sql
ALTER TABLE public.leads 
ADD COLUMN ghl_notes JSONB DEFAULT '[]'::jsonb;
```

Structure:
```json
[
  {
    "id": "note_id",
    "body": "Note content from GHL",
    "userId": "user_who_created",
    "dateAdded": "2026-01-28T..."
  }
]
```

### Phase 2: Edge Function Enhancement

Extend `sync-ghl-contacts/index.ts` to fetch GHL notes during single-contact sync:

**New Function:**
```typescript
async function fetchGHLNotes(apiKey: string, contactId: string): Promise<GHLNote[]> {
  const response = await fetch(`${GHL_BASE_URL}/contacts/${contactId}/notes`, {
    headers: { 
      'Authorization': `Bearer ${apiKey}`, 
      'Version': '2021-07-28' 
    }
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.notes || [];
}
```

**Update syncSingleContact:**
- Fetch notes after contact sync
- Store in `ghl_notes` column
- Return notes in response

**Improved Funded Investor Date Logic:**
Currently uses `lastStageChangeAt` > `dateUpdated` > `dateAdded`. Already implemented in `createFundedInvestorFromContact` function - no changes needed.

### Phase 3: TypeScript Interface Updates

Update `src/hooks/useLeadsAndCalls.ts`:

```typescript
export interface GHLNote {
  id: string;
  body: string;
  userId?: string;
  dateAdded: string;
}

export interface Lead {
  // ... existing fields
  ghl_notes?: GHLNote[];
}
```

### Phase 4: Record Details Panel Enhancement

Update `InlineRecordsView.tsx` Record Details section:

**4a. GHL Integration Section (all record types)**
Add to the top of Record Details when a record has a valid `external_id`:

```
+--------------------------------------------+
| GHL Integration                            |
| [Open in GHL ↗]                           |
| Last Sync: 2h ago          [Refresh ⟳]    |
| GHL ID: ABC123XYZ                          |
+--------------------------------------------+
```

**4b. Linked Contact Info (for calls, commitments, funded)**
Create helper to find linked lead:

```typescript
const getLinkedLead = (record: any, recordType: string): Lead | null => {
  if (recordType === 'lead') return record;
  
  // For calls, use lead_id
  if (record.lead_id) {
    return leads.find(l => l.id === record.lead_id) || null;
  }
  
  // For funded/commitments, match by external_id
  if (record.external_id) {
    return leads.find(l => l.external_id === record.external_id) || null;
  }
  
  return null;
};
```

When viewing a call/commitment/funded record, display the linked lead's:
- Name, Email, Phone
- UTM Parameters (Source, Medium, Campaign, Content, Term)
- Campaign Attribution (Campaign Name, Ad Set, Ad ID)
- Survey Questions

**4c. GHL Notes Section**
Display synced notes in Record Details:

```
+--------------------------------------------+
| GHL Notes                                  |
| "Client interested in Q2..." - 2 days ago  |
| "Follow-up scheduled..." - 1 week ago      |
+--------------------------------------------+
```

### Phase 5: Booked Calls Validation

Update `InlineRecordsView.tsx` to filter calls that lack contact info:

**5a. Create validation function:**
```typescript
const isValidBookedCall = (call: Call): boolean => {
  // Check if call has linked lead with contact info
  const linkedLead = leads.find(l => l.id === call.lead_id);
  if (!linkedLead) return false;
  
  // Must have at least name OR email OR phone
  return !!(linkedLead.name || linkedLead.email || linkedLead.phone);
};
```

**5b. Update filtered calls:**
```typescript
const bookedCalls = useMemo(() => 
  calls.filter(c => !c.is_reconnect && isValidBookedCall(c)), [calls, leads]);
```

**5c. Add "Show All" toggle:**
Add a small toggle to show/hide incomplete records if users want to see them.

### Phase 6: Calls Table Enhancement

Add linked contact info columns to Booked Calls, Showed Calls, Reconnect tabs:

| Existing Columns | New Columns |
|-----------------|-------------|
| Date | Name (from linked lead) |
| Outcome | Email (from linked lead) |
| Showed | Phone (from linked lead) |
| GHL | Source (from linked lead) |
| Actions | Campaign (from linked lead) |

---

## Component Changes Summary

### Files to Modify:

| File | Changes |
|------|---------|
| `supabase/functions/sync-ghl-contacts/index.ts` | Add `fetchGHLNotes`, update `syncSingleContact` to store notes |
| `src/hooks/useLeadsAndCalls.ts` | Add `ghl_notes` to Lead interface, add `GHLNote` interface |
| `src/components/dashboard/InlineRecordsView.tsx` | Add GHL section to Record Details, linked contact lookup, notes display, call validation |
| `src/hooks/useSingleContactSync.ts` | Minor: ensure notes are refreshed after sync |

### Database Changes:
- Add `leads.ghl_notes` column (JSONB)

---

## Record Details Panel Wireframe

```
+------------------------------------------+
| Record Details                           |
+------------------------------------------+
| GHL Integration                          |
| [Open in GHL ↗]                         |
| Last Sync: 2h ago          [Refresh ⟳]  |
| GHL ID: ABC123XYZ                        |
+------------------------------------------+
| Timeline                                 |
| ● Created: Jan 27, 2026                  |
| ● Updated: Jan 28, 2026                  |
+------------------------------------------+
| Contact Info (from linked lead)          |
| [Mail] john@example.com                  |
| [Phone] +1 555-123-4567                 |
| [Source] Facebook                        |
+------------------------------------------+
| Attribution                              |
| Campaign: Summer Campaign 2026           |
| Ad Set: Interest Targeting               |
| Ad ID: 12345678                          |
+------------------------------------------+
| GHL Notes                                |
| "Interested in $50k investment" - 2d ago |
| "Called back, very engaged" - 1w ago     |
+------------------------------------------+
| Form Questions                           |
| Q: Are you accredited?                   |
| A: Yes                                   |
+------------------------------------------+
```

---

## Data Flow for Congruent Matching

```
Lead (external_id: ABC123, id: lead_uuid)
    │
    ├──► Call (lead_id: lead_uuid) 
    │        → Shows lead's Name, Email, Phone, Attribution
    │
    ├──► Commitment (lead_id: lead_uuid OR external_id: ABC123)
    │        → Shows lead's contact info + attribution
    │
    └──► Funded (lead_id: lead_uuid)
             → Shows lead's contact info + attribution
```

All funnel stages display consistent:
- Name, Email, Phone
- UTM Parameters
- Campaign Attribution
- Survey Responses
- GHL Notes (when available)

---

## Technical Details

### GHL Notes API Call
```typescript
GET https://services.leadconnectorhq.com/contacts/{contactId}/notes
Headers:
  Authorization: Bearer {apiKey}
  Version: 2021-07-28
```

### Sync Button Visibility Rules
Show GHL integration section when:
- `ghlLocationId` is configured for client AND
- `record.external_id` exists AND
- `external_id` doesn't start with `wh_` or `manual-`

### Booked Calls Validation
Only display calls where the linked lead has at least one of:
- Non-empty `name`
- Non-empty `email`  
- Non-empty `phone`

---

## Estimated Changes

| Component | Lines of Code |
|-----------|---------------|
| Database Migration | ~3 |
| Edge Function Update | ~80 |
| Interface Updates | ~20 |
| InlineRecordsView Updates | ~200 |
| **Total** | **~303 lines** |

---

## Benefits

1. **End-to-End Tracking**: View complete contact journey from any funnel stage
2. **Data Accuracy**: Filter out incomplete/spam booked calls
3. **GHL Integration**: Direct links and notes visible in dashboard
4. **Consistent Attribution**: Same lead data shown across all funnel stages
5. **Manual Sync**: Refresh individual records on demand from detail panel
