

# Plan: MeetGeek Integration with Pending Task Approval

## Summary

Integrate MeetGeek.ai at the agency level to pull all meeting recordings, transcripts, and action items into the dashboard. Meetings can be manually assigned to clients, and action items extracted from meetings will create "pending tasks" that require user approval before being added to the project management system.

---

## Architecture Overview

```text
+------------------+     Webhook      +---------------------+
|   MeetGeek.ai    | ---------------> |  meetgeek-webhook   |
+------------------+  (on complete)   +---------------------+
                                              |
                                              | 1. Store meeting data
                                              | 2. Extract action items → pending_tasks
                                              v
                              +------------------------------+
                              |  Database Tables             |
                              |  - agency_meetings           |
                              |  - pending_meeting_tasks     |
                              +------------------------------+
                                        |
            +---------------------------+---------------------------+
            |                           |                           |
            v                           v                           v
+------------------+       +------------------------+    +------------------+
| Meetings List    |       | Pending Tasks Review   |    | AI Chat Context  |
| (assign client)  |       | (approve → real tasks) |    | (meeting data)   |
+------------------+       +------------------------+    +------------------+
```

---

## Database Schema

### New Table: `agency_meetings`

Stores all synced meeting data from MeetGeek.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| client_id | uuid | Optional - manually assigned client |
| meeting_id | text | MeetGeek meeting ID (unique) |
| title | text | Meeting title |
| meeting_date | timestamptz | When meeting occurred |
| duration_minutes | integer | Duration in minutes |
| participants | jsonb | Array of participant objects |
| summary | text | AI-generated summary |
| transcript | text | Full transcript |
| action_items | jsonb | Extracted action items from MeetGeek |
| recording_url | text | Link to recording |
| meetgeek_url | text | Link to MeetGeek dashboard |
| created_at | timestamptz | Record creation |

### New Table: `pending_meeting_tasks`

Stores proposed tasks from meetings awaiting user approval.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| meeting_id | uuid | Reference to agency_meetings |
| client_id | uuid | Suggested/inherited client |
| title | text | Task title (from action item) |
| description | text | Task description |
| priority | text | Suggested priority |
| status | text | 'pending' / 'approved' / 'rejected' |
| approved_at | timestamptz | When approved |
| approved_by | text | Who approved |
| task_id | uuid | Reference to tasks table (after approval) |
| created_at | timestamptz | Record creation |

### Update: `agency_settings` Table

Add MeetGeek configuration fields.

| New Column | Type | Description |
|------------|------|-------------|
| meetgeek_api_key | text | MeetGeek API key |
| meetgeek_webhook_secret | text | For signature verification |

---

## Implementation Details

### 1. Agency Settings - MeetGeek Configuration Tab

**File: `src/components/settings/AgencySettingsModal.tsx`**

Add a third tab "Integrations" with MeetGeek settings:

```text
+------------------------------------------------------------+
|  [AI Prompts] [API Keys] [Integrations]                    |
+------------------------------------------------------------+
|  MeetGeek.ai Integration                                   |
|  Sync meeting recordings and summaries automatically       |
|                                                            |
|  API Key                                                   |
|  [••••••••••••••••••••••••••]  [👁]                        |
|  Get from MeetGeek Settings > Integrations > Public API    |
|                                                            |
|  Webhook Secret (optional)                                 |
|  [••••••••••••••••••••••••••]  [👁]                        |
|  For signature verification                                |
|                                                            |
|  Webhook URL (copy this to MeetGeek)                       |
|  https://[project-id].supabase.co/functions/v1/meetgeek-webhook
|  [📋 Copy]                                                 |
|                                                            |
|  [🔄 Sync Recent Meetings]                                 |
+------------------------------------------------------------+
```

---

### 2. Edge Function: `meetgeek-webhook`

**New File: `supabase/functions/meetgeek-webhook/index.ts`**

Handles incoming webhooks from MeetGeek:

1. Validate webhook signature (optional, using `X-MG-Signature` header)
2. Fetch full meeting details via MeetGeek API:
   - `GET /meetings/{meeting_id}` - Basic info
   - `GET /meetings/{meeting_id}/transcript` - Full transcript
   - `GET /meetings/{meeting_id}/summary` - AI summary
   - `GET /meetings/{meeting_id}/insights` - Action items
3. Store meeting in `agency_meetings` table
4. Extract action items and create entries in `pending_meeting_tasks` (status: 'pending')
5. Return 200 OK

**Also handles manual sync** via POST with `{ action: 'sync' }` to pull recent meetings.

---

### 3. Meetings Hook

**New File: `src/hooks/useMeetings.ts`**

```typescript
export interface Meeting {
  id: string;
  client_id: string | null;
  meeting_id: string;
  title: string;
  meeting_date: string;
  duration_minutes: number;
  participants: any[];
  summary: string;
  transcript: string;
  action_items: any[];
  recording_url: string;
  meetgeek_url: string;
  created_at: string;
}

export interface PendingMeetingTask {
  id: string;
  meeting_id: string;
  client_id: string | null;
  title: string;
  description: string;
  priority: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  task_id: string | null;
  created_at: string;
  meeting?: Meeting; // Joined
}

// Hooks
export function useMeetings(clientId?: string)
export function usePendingMeetingTasks()
export function useAssignMeetingToClient()
export function useApprovePendingTask()
export function useRejectPendingTask()
export function useSyncMeetings()
```

---

### 4. Meetings List Component

**New File: `src/components/meetings/MeetingsList.tsx`**

Displays all agency meetings with client assignment:

```text
+------------------------------------------------------------------+
|  Agency Meetings              [🔄 Sync]         [Filter ▾]       |
+------------------------------------------------------------------+
| 🔍 Search meetings...                                            |
+------------------------------------------------------------------+
| Date       | Title                | Client       | Duration | ▶️ |
|------------|----------------------|--------------|----------|----|
| Jan 25     | Weekly Strategy Call | [Assign ▾]   | 45 min   | ▶️ |
| Jan 24     | Campaign Review      | Blue Capital | 32 min   | ▶️ |
| Jan 23     | Onboarding Call      | HRT          | 58 min   | ▶️ |
+------------------------------------------------------------------+
```

**Features:**
- Client assignment dropdown per meeting
- Click to expand: summary, transcript, action items
- "View in MeetGeek" external link
- Recording playback link
- "Create Task" button for individual action items

---

### 5. Meeting Detail Modal

**New File: `src/components/meetings/MeetingDetailModal.tsx`**

Comprehensive meeting view:

```text
+------------------------------------------------------------------+
|  Weekly Strategy Call                          Jan 25, 2026      |
|  Duration: 45 min | Client: [Blue Capital ▾]   [View in MeetGeek]|
+------------------------------------------------------------------+
|  [Summary] [Transcript] [Action Items]                           |
+------------------------------------------------------------------+
|  Summary                                                         |
|  Discussed Q1 campaign performance. CPL is trending well at      |
|  $42. Team agreed to increase budget by 20% next month.          |
|  Follow-up needed on creative refresh timeline.                  |
+------------------------------------------------------------------+
|  Action Items (3)                                                |
|  +---------------------------------------------------------+     |
|  | ☐ Increase Meta ad budget by 20%           [+ Add Task] |     |
|  | ☐ Schedule creative review for next week   [+ Add Task] |     |
|  | ☐ Send Q1 performance report to client     [+ Add Task] |     |
|  +---------------------------------------------------------+     |
+------------------------------------------------------------------+
```

**"+ Add Task" creates a pending task** with pre-filled title/description for user review.

---

### 6. Pending Tasks Review Panel

**New File: `src/components/meetings/PendingTasksReview.tsx`**

Shows all pending tasks from meetings awaiting approval:

```text
+------------------------------------------------------------------+
|  Pending Tasks from Meetings                    4 pending        |
+------------------------------------------------------------------+
|  From: Weekly Strategy Call (Jan 25)                             |
|  +--------------------------------------------------------------+|
|  | Increase Meta ad budget by 20%                               ||
|  | Client: Blue Capital | Priority: [Medium ▾]                  ||
|  | [Edit Title] [Edit Description]                              ||
|  |                                               [✓ Approve] [✗]||
|  +--------------------------------------------------------------+|
|  | Schedule creative review for next week                       ||
|  | Client: Blue Capital | Priority: [Medium ▾]                  ||
|  |                                               [✓ Approve] [✗]||
|  +--------------------------------------------------------------+|
+------------------------------------------------------------------+
|                              [Approve All Selected]              |
+------------------------------------------------------------------+
```

**Workflow:**
1. User reviews each pending task
2. Can edit title, description, priority, or reassign client
3. Click "Approve" → Creates real task in `tasks` table
4. Click "✗" (Reject) → Marks as rejected, doesn't create task

---

### 7. Activity Feed Integration

**File: `src/components/tasks/ActivityFeed.tsx`**

Add new activity types:

```typescript
type ActivityType = 
  | 'task_created' 
  | 'task_completed' 
  | 'creative_uploaded' 
  | 'creative_approved' 
  | 'creative_launched'
  | 'meeting_synced'      // NEW
  | 'meeting_task_created'; // NEW (when pending task approved)

// Add to ACTIVITY_CONFIG:
meeting_synced: { 
  icon: Video, 
  label: 'Meeting Synced', 
  color: 'text-indigo-500' 
},
meeting_task_created: { 
  icon: CheckSquare, 
  label: 'Task from Meeting', 
  color: 'text-cyan-500' 
},
```

---

### 8. AI Chat Context Enhancement

**File: `src/components/chat/AgencyChatInterface.tsx`**

Update `buildContext()` to include meeting data:

```typescript
const buildContext = useCallback(() => {
  // ... existing client and task logic ...
  
  // Add meeting summaries for AI context
  const meetingSummaries = meetings.slice(0, 10).map(m => ({
    title: m.title,
    date: m.meeting_date,
    client: clients.find(c => c.id === m.client_id)?.name || 'Unassigned',
    summary: m.summary?.slice(0, 500), // Truncate for context
    actionItems: m.action_items?.length || 0,
  }));

  return {
    agencyTotals: { ... },
    clients: clientSummaries,
    tasks: taskSummaries,
    recentMeetings: meetingSummaries, // NEW
  };
}, [clients, clientMetrics, agencyMetrics, allTasks, meetings]);
```

**Also add client filter dropdown** to the AI chat header so users can focus questions on a specific client.

---

### 9. Agency Dashboard Integration

**File: `src/pages/Index.tsx`**

Add Meetings section to the agency dashboard:

```tsx
{/* Meetings Section */}
<section>
  <div className="flex items-center justify-between mb-2">
    <div>
      <h2 className="text-lg font-bold">Recent Meetings</h2>
      <p className="text-sm text-muted-foreground">
        Synced from MeetGeek with action items
      </p>
    </div>
    <div className="flex gap-2">
      {pendingTasksCount > 0 && (
        <Button variant="outline" size="sm" onClick={() => setPendingTasksOpen(true)}>
          <CheckCircle className="h-4 w-4 mr-2" />
          {pendingTasksCount} Pending Tasks
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={handleSyncMeetings}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Sync
      </Button>
    </div>
  </div>
  <MeetingsList meetings={meetings} clients={clients} />
</section>
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/meetgeek-webhook/index.ts` | Webhook handler + manual sync |
| `src/hooks/useMeetings.ts` | React Query hooks for meetings and pending tasks |
| `src/components/meetings/MeetingsList.tsx` | Agency-wide meetings list |
| `src/components/meetings/MeetingDetailModal.tsx` | Full meeting view with transcript |
| `src/components/meetings/PendingTasksReview.tsx` | Pending task approval panel |

---

## Files to Modify

| File | Changes |
|------|---------|
| `agency_settings` table | Add `meetgeek_api_key`, `meetgeek_webhook_secret` columns |
| `src/hooks/useAgencySettings.ts` | Add MeetGeek fields to interface |
| `src/components/settings/AgencySettingsModal.tsx` | Add Integrations tab with MeetGeek config |
| `src/components/tasks/ActivityFeed.tsx` | Add meeting activity types |
| `src/components/chat/AgencyChatInterface.tsx` | Add client filter, include meetings in AI context |
| `src/pages/Index.tsx` | Add MeetingsList and PendingTasksReview |
| `supabase/config.toml` | Register meetgeek-webhook function |

---

## User Workflow

### Initial Setup
1. Go to **Agency Settings > Integrations**
2. Paste MeetGeek API key
3. Copy the webhook URL displayed
4. In MeetGeek dashboard, paste webhook URL under **Settings > Integrations > Public API**
5. Click "Sync Recent Meetings" to pull existing data

### Ongoing Usage
1. After each meeting, MeetGeek webhook fires automatically
2. Meeting appears in "Recent Meetings" section
3. If action items detected, they appear in "Pending Tasks" panel
4. User reviews and assigns to a client if needed
5. Click "Approve" to add as real task, or "Reject" to dismiss
6. AI chat can reference all meeting summaries and notes

---

## Task Approval Flow

```text
MeetGeek extracts action item
        |
        v
+-------------------+
| pending_meeting_  |  status = 'pending'
| tasks table       |
+-------------------+
        |
        | User clicks "Approve"
        v
+-------------------+     +-------------------+
| Update pending    | --> | Create task in    |
| status='approved' |     | tasks table       |
| task_id = new_id  |     +-------------------+
+-------------------+
        |
        | User clicks "Reject"
        v
+-------------------+
| Update pending    |  (no task created)
| status='rejected' |
+-------------------+
```

---

## Expected Outcome

1. **All meetings sync** automatically from MeetGeek via webhook
2. **Manual client assignment** - meetings aren't auto-assigned, user picks the client
3. **Action items become pending tasks** - require explicit approval
4. **Approval workflow** - edit, assign client, set priority before adding
5. **AI has meeting context** - can reference summaries in conversations
6. **Activity feed** shows meeting syncs and approved tasks

