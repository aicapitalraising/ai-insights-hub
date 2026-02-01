
# Calls Sync Enhancement Plan

## Problem Summary

The current database shows **only 3.55% of calls have linked leads** (12 out of 338 calls). This means:
- 326 calls are missing contact information (name, email, phone)
- Reports and filters based on lead data won't work for these calls
- The UI shows blank rows for calls without lead associations

## Root Causes Identified

1. **Orphaned Call Records**: Calls are created with `external_id` (GHL contact ID) but no `lead_id` is set
2. **Missing Link Step**: The `syncCallToDatabase` function only enriches existing calls but doesn't link them to leads
3. **No Appointment-to-Call Creation**: GHL appointments fetched during timeline sync aren't being converted to call records

## Solution Overview

Enhance the `sync-ghl-contacts` edge function to:
1. **Link orphaned calls to leads** after contact sync
2. **Create call records from GHL appointments** with proper lead linkage
3. **Add a dedicated sync mode for calls** that fetches appointments and links them properly

---

## Technical Implementation

### Phase 1: Add Call Linking Function

**File: `supabase/functions/sync-ghl-contacts/index.ts`**

Add a new function after contact sync to link orphaned calls:

```typescript
async function linkOrphanedCallsToLeads(
  supabase: any,
  clientId: string
): Promise<{ linked: number; errors: string[] }> {
  const result = { linked: 0, errors: [] as string[] };
  
  // Find calls without lead_id where external_id matches a lead's external_id
  const { data: orphanedCalls, error: fetchError } = await supabase
    .from('calls')
    .select('id, external_id, client_id')
    .eq('client_id', clientId)
    .is('lead_id', null);
  
  if (fetchError || !orphanedCalls) {
    result.errors.push(`Failed to fetch orphaned calls: ${fetchError?.message}`);
    return result;
  }
  
  console.log(`Found ${orphanedCalls.length} orphaned calls for client ${clientId}`);
  
  for (const call of orphanedCalls) {
    // Try to match call.external_id to a lead's external_id
    const { data: matchingLead } = await supabase
      .from('leads')
      .select('id, name, email, phone')
      .eq('client_id', clientId)
      .eq('external_id', call.external_id)
      .maybeSingle();
    
    if (matchingLead) {
      const { error: updateError } = await supabase
        .from('calls')
        .update({ 
          lead_id: matchingLead.id,
          ghl_synced_at: new Date().toISOString()
        })
        .eq('id', call.id);
      
      if (!updateError) {
        result.linked++;
      } else {
        result.errors.push(`Failed to link call ${call.id}: ${updateError.message}`);
      }
    }
  }
  
  console.log(`Linked ${result.linked} calls to leads`);
  return result;
}
```

### Phase 2: Create Calls from GHL Appointments

**File: `supabase/functions/sync-ghl-contacts/index.ts`**

Add function to sync appointments as call records:

```typescript
async function syncAppointmentsAsCalls(
  supabase: any,
  clientId: string,
  contactId: string,
  leadId: string | null,
  apiKey: string
): Promise<{ created: number; updated: number }> {
  const result = { created: 0, updated: 0 };
  
  // Fetch appointments for this contact
  const appointments = await fetchGHLAppointments(apiKey, contactId);
  
  for (const appt of appointments) {
    const appointmentId = appt.id;
    const calendarId = appt.calendarId;
    const status = (appt.status || appt.appointmentStatus || '').toLowerCase();
    
    // Map GHL appointment status to our call outcome
    let outcome = 'booked';
    let showed = false;
    
    if (status === 'showed' || status === 'completed') {
      outcome = 'showed';
      showed = true;
    } else if (status === 'noshow' || status === 'no-show' || status === 'no_show') {
      outcome = 'no_show';
      showed = false;
    } else if (status === 'cancelled' || status === 'canceled') {
      outcome = 'cancelled';
      showed = false;
    } else if (status === 'confirmed') {
      outcome = 'booked';
      showed = false;
    }
    
    const callData = {
      client_id: clientId,
      lead_id: leadId,
      external_id: contactId, // Use contact ID as external_id for matching
      ghl_appointment_id: appointmentId,
      ghl_calendar_id: calendarId,
      scheduled_at: appt.startTime || appt.dateAdded,
      appointment_status: status,
      showed,
      outcome,
      booked_at: appt.dateAdded || appt.createdAt,
      ghl_synced_at: new Date().toISOString(),
    };
    
    // Upsert using the partial unique index on (client_id, ghl_appointment_id)
    const { data: existingCall } = await supabase
      .from('calls')
      .select('id')
      .eq('client_id', clientId)
      .eq('ghl_appointment_id', appointmentId)
      .maybeSingle();
    
    if (existingCall) {
      // Update existing call
      await supabase
        .from('calls')
        .update({
          lead_id: leadId, // Link to lead
          scheduled_at: callData.scheduled_at,
          appointment_status: callData.appointment_status,
          showed: callData.showed,
          outcome: callData.outcome,
          ghl_synced_at: new Date().toISOString(),
        })
        .eq('id', existingCall.id);
      result.updated++;
    } else {
      // Create new call record
      await supabase
        .from('calls')
        .insert(callData);
      result.created++;
    }
  }
  
  return result;
}
```

### Phase 3: Integrate into Sync Flow

**File: `supabase/functions/sync-ghl-contacts/index.ts`**

Modify `syncContactToDatabase` to also sync appointments:

```typescript
// After syncing contact to lead, sync their appointments as calls
if (syncResult.leadId) {
  const appointmentResult = await syncAppointmentsAsCalls(
    supabase,
    clientId,
    contact.id,
    syncResult.leadId,
    apiKey
  );
  // Track results
}
```

Add call to `linkOrphanedCallsToLeads` at the end of `syncClientContacts`:

```typescript
// At the end of syncClientContacts, after all contacts are synced:
const linkResult = await linkOrphanedCallsToLeads(supabase, client.id);
console.log(`Linked ${linkResult.linked} orphaned calls to leads`);
```

### Phase 4: Add Dedicated Calls Sync Mode

**File: `supabase/functions/sync-ghl-contacts/index.ts`**

Add a new mode handler in the main serve function:

```typescript
// Handle calls enrichment mode
if (mode === 'calls' && targetClientId) {
  // 1. Link orphaned calls to leads
  const linkResult = await linkOrphanedCallsToLeads(supabase, targetClientId);
  
  // 2. Sync appointments for all leads
  const { data: leads } = await supabase
    .from('leads')
    .select('id, external_id')
    .eq('client_id', targetClientId)
    .not('external_id', 'is', null);
  
  let callsCreated = 0;
  let callsUpdated = 0;
  
  for (const lead of (leads || [])) {
    const apptResult = await syncAppointmentsAsCalls(
      supabase,
      targetClientId,
      lead.external_id,
      lead.id,
      client.ghl_api_key
    );
    callsCreated += apptResult.created;
    callsUpdated += apptResult.updated;
  }
  
  return new Response(JSON.stringify({
    success: true,
    linked: linkResult.linked,
    calls_created: callsCreated,
    calls_updated: callsUpdated,
  }), { headers: ... });
}
```

### Phase 5: Update useSyncClient Hook

**File: `src/hooks/useSyncClient.ts`**

Update `syncCalls` to use the new dedicated mode:

```typescript
const syncCalls = useCallback(async (): Promise<SyncResult> => {
  if (!clientId) return { success: false, error: 'No client ID' };

  setProgress({ isLoading: true, type: 'calls', message: 'Syncing calls from GHL...' });
  
  try {
    const { data, error } = await supabase.functions.invoke('sync-ghl-contacts', {
      body: { client_id: clientId, mode: 'calls' }
    });

    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Sync failed');

    const linked = data?.linked || 0;
    const created = data?.calls_created || 0;
    const updated = data?.calls_updated || 0;

    invalidateQueries();
    toast.success(`Calls synced: ${linked} linked, ${created} created, ${updated} updated`);
    
    return { success: true, created, updated };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    toast.error(`Call sync failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  } finally {
    setProgress({ isLoading: false, type: null, message: null });
  }
}, [clientId, invalidateQueries]);
```

---

## Data Flow Summary

```text
GHL Contact Sync Flow:
┌─────────────────┐
│ Fetch Contacts  │
│ from GHL API    │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ Upsert to leads │◄─── Uses external_id as unique key
│ table           │
└───────┬─────────┘
        │
        ▼
┌─────────────────────────┐
│ Fetch appointments for  │
│ each contact from GHL   │
└───────┬─────────────────┘
        │
        ▼
┌─────────────────────────┐
│ Upsert to calls table   │◄─── Links lead_id, uses ghl_appointment_id
│ with lead_id linked     │
└───────┬─────────────────┘
        │
        ▼
┌─────────────────────────┐
│ Link any remaining      │
│ orphaned calls by       │
│ matching external_id    │
└─────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/sync-ghl-contacts/index.ts` | Add `linkOrphanedCallsToLeads`, `syncAppointmentsAsCalls` functions; add `mode: 'calls'` handler; integrate into sync flow |
| `src/hooks/useSyncClient.ts` | Update `syncCalls` to use `mode: 'calls'` |

---

## Expected Outcomes

After implementation:
- **All existing orphaned calls will be linked** to their corresponding leads
- **New appointments will create call records** with proper lead associations
- **Call records will display contact info** (name, email, phone) in the UI
- **The Calls table in InlineRecordsView** will show complete data instead of empty rows

## Rollout Considerations

- The orphan linking is idempotent and safe to run multiple times
- Appointment sync uses upsert logic to avoid duplicates
- No breaking changes to existing data or functionality
