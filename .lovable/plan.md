

# Comprehensive Sync Queue Implementation Plan

## Overview

This plan implements a robust sync queue system that processes all leads, calls, appointments, and timeline data from GoHighLevel (GHL) API for all clients. Since we cannot call all clients at once due to API rate limits and edge function timeouts, we'll implement a job queue with staggered processing.

## Current State Analysis

**What exists:**
- 17 active clients (3 healthy, 13 with errors, 1 not configured)
- 1,328 leads already synced
- 338 calls in database
- 89 timeline events
- Edge function with 500ms delays between batches
- MAX_CONTACTS limit of 500-1000 per run
- No dedicated job queue table

**Constraints:**
- Edge function timeout: ~30 seconds max
- GHL API rate limits require 200-500ms delays between requests
- Cannot process all 17 clients in a single function call
- Historical sync (365 days) requires multiple passes per client

---

## Implementation Plan

### Phase 1: Create Sync Queue Infrastructure

#### 1.1 New Database Table: `sync_queue`

Create a job queue table to track pending sync operations:

```sql
CREATE TABLE public.sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  sync_type TEXT NOT NULL, -- 'contacts', 'appointments', 'timeline', 'full'
  priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  date_range_start DATE,
  date_range_end DATE,
  batch_number INTEGER DEFAULT 1,
  total_batches INTEGER DEFAULT 1,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_queue_pending ON sync_queue(status, priority, created_at) 
  WHERE status = 'pending';
```

#### 1.2 Helper Function: Queue All Clients

Create a database function to enqueue sync jobs for all clients:

```sql
CREATE OR REPLACE FUNCTION queue_full_sync_all_clients(days_back INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  client_record RECORD;
  jobs_created INTEGER := 0;
  batch_size INTEGER := 90; -- Days per batch
  num_batches INTEGER;
  i INTEGER;
BEGIN
  num_batches := CEIL(days_back::DECIMAL / batch_size);
  
  FOR client_record IN 
    SELECT id FROM clients 
    WHERE status = 'active' 
      AND ghl_api_key IS NOT NULL 
      AND ghl_location_id IS NOT NULL
  LOOP
    -- Create batched jobs for each 90-day period
    FOR i IN 1..num_batches LOOP
      INSERT INTO sync_queue (
        client_id, sync_type, priority, 
        date_range_start, date_range_end,
        batch_number, total_batches
      ) VALUES (
        client_record.id, 'full',
        CASE WHEN i = 1 THEN 1 ELSE 5 END, -- Recent data first
        CURRENT_DATE - (i * batch_size),
        CURRENT_DATE - ((i - 1) * batch_size),
        i, num_batches
      );
      jobs_created := jobs_created + 1;
    END LOOP;
  END LOOP;
  
  RETURN jobs_created;
END;
$$ LANGUAGE plpgsql;
```

---

### Phase 2: Create Sync Worker Edge Function

#### 2.1 New Edge Function: `sync-queue-worker`

This function processes one job at a time from the queue:

```typescript
// supabase/functions/sync-queue-worker/index.ts
serve(async (req) => {
  // 1. Claim the next pending job (atomic update)
  const { data: job } = await supabase
    .from('sync_queue')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .select()
    .single();

  if (!job) {
    return { success: true, message: 'No pending jobs' };
  }

  // 2. Get client credentials
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, ghl_api_key, ghl_location_id')
    .eq('id', job.client_id)
    .single();

  // 3. Process based on sync_type
  let result;
  try {
    if (job.sync_type === 'contacts' || job.sync_type === 'full') {
      result = await syncContactsBatch(client, job.date_range_start, job.date_range_end);
    }
    if (job.sync_type === 'appointments' || job.sync_type === 'full') {
      result = await syncAppointmentsBatch(client, job.date_range_start, job.date_range_end);
    }
    if (job.sync_type === 'timeline' || job.sync_type === 'full') {
      result = await syncTimelineBatch(client, job.date_range_start, job.date_range_end);
    }

    // 4. Mark job complete
    await supabase.from('sync_queue').update({
      status: 'completed',
      records_processed: result.total,
      completed_at: new Date().toISOString()
    }).eq('id', job.id);

  } catch (error) {
    // 5. Mark job failed with error
    await supabase.from('sync_queue').update({
      status: 'failed',
      error_message: error.message,
      completed_at: new Date().toISOString()
    }).eq('id', job.id);
  }
});
```

#### 2.2 Sync Logic by Type

**Contacts Sync:**
- Fetch contacts from GHL API with pagination
- Filter by `dateAdded` within date range
- Upsert to `leads` table using `(client_id, external_id)` constraint
- Preserve GHL `dateAdded` as `created_at` for reporting

**Appointments Sync:**
- Fetch from `/calendars/{calendarId}/events` for tracked calendars
- Upsert to `calls` table with `appointment_status`
- Map calendar IDs to `is_reconnect` flag
- Link to `lead_id` via contact matching

**Timeline Sync:**
- For each contact in date range, fetch notes/tasks/appointments/messages
- Insert into `contact_timeline_events` table
- Process in batches of 10 contacts with 500ms delays

---

### Phase 3: Scheduled Queue Processing

#### 3.1 Update pg_cron Jobs

Configure cron to process the queue every 5 minutes:

```sql
-- Process queue every 5 minutes
SELECT cron.schedule(
  'process-sync-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jgwwmtuvjlmzapwqiabu.supabase.co/functions/v1/sync-queue-worker',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);
```

This means:
- 1 job processed every 5 minutes
- 12 jobs per hour
- 288 jobs per day
- Full sync of 17 clients x 4 batches = 68 jobs = ~6 hours

#### 3.2 Hourly Incremental Sync

Keep the existing hourly sync for recent data (last 24 hours):

```sql
-- Hourly sync for recent data (existing job)
SELECT cron.schedule(
  'hourly-ghl-sync',
  '0 * * * *',
  $$SELECT net.http_post(..., body := '{"sync_type": "contacts", "days": 1}')$$
);
```

---

### Phase 4: Manual Trigger UI

#### 4.1 Add "Queue Full Sync" Button

In `ClientSettingsModal.tsx` → Integrations tab:

```tsx
const handleQueueFullSync = async () => {
  // Queue sync jobs for this client
  await supabase.rpc('queue_client_sync', { 
    p_client_id: clientId, 
    p_days_back: 365 
  });
  toast.success('Sync jobs queued. Processing will begin shortly.');
};
```

#### 4.2 Add "Sync All Clients" Button

In agency settings or admin panel:

```tsx
const handleQueueAllClients = async () => {
  const { data: jobsCreated } = await supabase.rpc('queue_full_sync_all_clients', { 
    days_back: 365 
  });
  toast.success(`Queued ${jobsCreated} sync jobs for all clients.`);
};
```

---

### Phase 5: Queue Monitoring Dashboard

#### 5.1 Sync Queue Status Component

Add a component to show queue progress:

```tsx
// src/components/settings/SyncQueueStatus.tsx
const SyncQueueStatus = () => {
  const { data: queueStats } = useQuery({
    queryKey: ['sync-queue-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sync_queue')
        .select('status, count(*)')
        .group('status');
      return data;
    }
  });

  return (
    <div>
      <h3>Sync Queue</h3>
      <div>Pending: {queueStats?.pending || 0}</div>
      <div>Processing: {queueStats?.processing || 0}</div>
      <div>Completed: {queueStats?.completed || 0}</div>
      <div>Failed: {queueStats?.failed || 0}</div>
    </div>
  );
};
```

---

## Processing Timeline

For a full sync of all clients (17 clients x 365 days):

| Phase | Jobs | Processing Time |
|-------|------|-----------------|
| Recent data (0-90 days) | 17 jobs | ~1.5 hours |
| Historical (90-180 days) | 17 jobs | ~1.5 hours |
| Historical (180-270 days) | 17 jobs | ~1.5 hours |
| Historical (270-365 days) | 17 jobs | ~1.5 hours |
| **Total** | **68 jobs** | **~6 hours** |

Timeline sync adds an additional pass but can run concurrently.

---

## Files to Create/Modify

### New Files
- `supabase/functions/sync-queue-worker/index.ts` - Queue worker function
- `src/components/settings/SyncQueueStatus.tsx` - Queue monitoring UI

### Modified Files
- Database migration for `sync_queue` table and helper functions
- `src/components/settings/ClientSettingsModal.tsx` - Add queue button
- `src/components/settings/AgencySettingsModal.tsx` - Add "Sync All" button
- `supabase/config.toml` - Register new edge function

---

## Summary

This queue-based architecture ensures:

1. **No API rate limit violations** - 5-minute gaps between jobs
2. **No edge function timeouts** - Each job processes one client + one date range
3. **Resumable syncs** - Failed jobs can be retried
4. **Prioritized processing** - Recent data synced first
5. **Full visibility** - Queue status shown in UI
6. **Automated background processing** - pg_cron triggers every 5 minutes

The system will sync all 17 clients' historical data (365 days) in approximately 6 hours, with real-time updates continuing every hour for new data.

