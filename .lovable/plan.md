
# Team Pods & Client Assignment System

## Overview

This plan implements a pod-based team structure where agency members are organized into functional pods (Creatives, Media Buyer, Account Manager, CRM, Project Manager), pods are assigned to clients, and visibility is controlled so that **clients only see pod names** while **team members see individual names and their assigned tasks**.

---

## Architecture

```text
+-------------------+       +------------------+       +------------------+
| agency_members    |<----->| agency_pods      |<----->| client_pod_      |
|                   |  M:N  | (new table)      |  M:N  | assignments      |
| - id              |       | - id             |       | (new table)      |
| - name            |       | - name           |       | - client_id      |
| - email           |       | - description    |       | - pod_id         |
| - role            |       | - color          |       | - is_lead (bool) |
| - pod_id (new FK) |       +------------------+       +------------------+
+-------------------+
```

### Data Flow
1. **Agency Settings** → Manage pods and assign members to pods
2. **Client Settings** → Assign pods to clients (with optional lead designation)
3. **Task Assignment** → Assign tasks to individual members OR to pods
4. **Client View** → Shows only pod names (e.g., "Creatives Pod" instead of "John Smith")
5. **Agency View** → Shows full member details and task assignments

---

## Database Changes

### 1. New Table: `agency_pods`
```sql
CREATE TABLE public.agency_pods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1', -- For visual distinction
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initial seed data
INSERT INTO public.agency_pods (name, description, color) VALUES
  ('Creatives', 'Creative design and ad production team', '#ec4899'),
  ('Media Buying', 'Media buying and campaign management', '#3b82f6'),
  ('Account Management', 'Client relationship and strategy', '#10b981'),
  ('CRM', 'CRM setup and automation', '#f59e0b'),
  ('Project Management', 'Project oversight and coordination', '#8b5cf6');
```

### 2. Update `agency_members` Table
```sql
ALTER TABLE public.agency_members 
  ADD COLUMN pod_id UUID REFERENCES public.agency_pods(id) ON DELETE SET NULL;
```

### 3. New Table: `client_pod_assignments`
```sql
CREATE TABLE public.client_pod_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  pod_id UUID NOT NULL REFERENCES public.agency_pods(id) ON DELETE CASCADE,
  is_lead BOOLEAN DEFAULT false, -- For Project Manager designation
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, pod_id)
);
```

### 4. RLS Policies
```sql
-- agency_pods: Public read/write for agency
ALTER TABLE public.agency_pods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view agency_pods" ON public.agency_pods FOR SELECT USING (true);
CREATE POLICY "Public can insert agency_pods" ON public.agency_pods FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update agency_pods" ON public.agency_pods FOR UPDATE USING (true);
CREATE POLICY "Public can delete agency_pods" ON public.agency_pods FOR DELETE USING (true);

-- client_pod_assignments: Public read/write
ALTER TABLE public.client_pod_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view client_pod_assignments" ON public.client_pod_assignments FOR SELECT USING (true);
CREATE POLICY "Public can insert client_pod_assignments" ON public.client_pod_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update client_pod_assignments" ON public.client_pod_assignments FOR UPDATE USING (true);
CREATE POLICY "Public can delete client_pod_assignments" ON public.client_pod_assignments FOR DELETE USING (true);
```

---

## Frontend Changes

### 1. New Hook: `useAgencyPods`
**File:** `src/hooks/useAgencyPods.ts`

```typescript
// Interfaces
export interface AgencyPod {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
}

export interface ClientPodAssignment {
  id: string;
  client_id: string;
  pod_id: string;
  is_lead: boolean;
  pod?: AgencyPod;
}

// Hooks
- useAgencyPods() - Fetch all pods
- useCreatePod() - Create new pod
- useUpdatePod() - Update pod details
- useDeletePod() - Delete pod
- useClientPodAssignments(clientId) - Get pods assigned to client
- useAssignPodToClient() - Assign pod to client
- useRemovePodFromClient() - Remove pod from client
```

### 2. Update `useAgencyMembers` Interface
**File:** `src/hooks/useTasks.ts`

```typescript
export interface AgencyMember {
  id: string;
  name: string;
  email: string;
  role: string;
  pod_id: string | null; // NEW
  pod?: AgencyPod;       // NEW (joined)
  created_at: string;
  updated_at: string;
}
```

### 3. Agency Settings Modal - New "Team" Tab
**File:** `src/components/settings/AgencySettingsModal.tsx`

Add a 4th tab with:
- **Pod Management Section**
  - List of existing pods with color indicators
  - Add/Edit/Delete pods
  - Each pod shows member count
  
- **Team Members Section**
  - List all agency members
  - Add new member button
  - Assign member to pod via dropdown
  - Show pod badge next to each member

```
┌─────────────────────────────────────────────────┐
│ Team Management                                  │
├─────────────────────────────────────────────────┤
│ PODS                           [+ Add Pod]      │
│ ┌───────────────────────────────────────┐       │
│ │ 🟣 Creatives         (3 members) [✏️]│       │
│ │ 🔵 Media Buying      (2 members) [✏️]│       │
│ │ 🟢 Account Mgmt      (1 member)  [✏️]│       │
│ │ 🟡 CRM               (2 members) [✏️]│       │
│ │ 🟣 Project Mgmt      (1 member)  [✏️]│       │
│ └───────────────────────────────────────┘       │
│                                                  │
│ TEAM MEMBERS                  [+ Add Member]    │
│ ┌───────────────────────────────────────┐       │
│ │ John Smith    [Media Buying ▼]  [✏️]│       │
│ │ Jane Doe      [Creatives ▼]      [✏️]│       │
│ │ Bob Wilson    [Project Mgmt ▼]   [✏️]│       │
│ └───────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

### 4. Client Settings Modal - Pod Assignment Section
**File:** `src/components/settings/ClientSettingsModal.tsx`

Add section to assign pods to client:

```
┌─────────────────────────────────────────────────┐
│ Assigned Teams                                   │
├─────────────────────────────────────────────────┤
│ ☑ Creatives                                     │
│ ☑ Media Buying                                  │
│ ☐ Account Management                            │
│ ☐ CRM                                           │
│ ☑ Project Management  ★ (Lead)                  │
│                                                  │
│ [Select Lead Pod ▼] Project Management          │
└─────────────────────────────────────────────────┘
```

### 5. Task Assignment UI Updates
**File:** `src/components/tasks/CreateTaskModal.tsx`

Update assignment section:
- Group members by pod in dropdown
- Show pod color badges
- Option to assign to entire pod or specific member

```
Assign To:
┌─────────────────────────────────────────┐
│ [Select assignee ▼]                     │
│  ─── Creatives ───                      │
│    ○ John Smith                         │
│    ○ Jane Doe                           │
│  ─── Media Buying ───                   │
│    ○ Bob Wilson                         │
│  ─── Unassigned ───                     │
│    ○ Mike Jones                         │
└─────────────────────────────────────────┘
```

### 6. Visibility Control for Public/Client Views
**Files:** 
- `src/components/tasks/KanbanTaskCard.tsx`
- `src/components/tasks/TaskDetailModal.tsx`

Add `isPublicView` prop handling:
- **Agency View**: Show full member name and avatar
- **Public View**: Show pod name only (e.g., "Creatives Pod" instead of "John Smith")

```typescript
// In KanbanTaskCard
const displayAssignee = isPublicView 
  ? assignee?.pod?.name ? `${assignee.pod.name} Pod` : 'Team'
  : assignee?.name;
```

### 7. KanbanBoard Public View Updates
**File:** `src/components/tasks/KanbanBoard.tsx`

- Hide assignee filter dropdown in public view (already done)
- Pass `isPublicView` to task cards
- Show pod names instead of individual names

---

## Component Tree

```
AgencySettingsModal
├── TabsList
│   ├── AI Prompts
│   ├── API Keys
│   ├── Integrations
│   └── Team (NEW)
└── Team Tab Content
    ├── PodManagementSection (NEW)
    │   ├── PodCard (per pod)
    │   └── AddPodDialog
    └── TeamMembersSection (NEW)
        ├── MemberRow (per member)
        └── AddMemberDialog (existing, enhanced)

ClientSettingsModal
└── PodAssignmentSection (NEW)
    ├── PodCheckbox (per pod)
    └── LeadPodSelector

CreateTaskModal
└── AssignmentSection
    └── GroupedMemberSelect (members grouped by pod)
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useAgencyPods.ts` | CREATE | New hook for pod management |
| `src/hooks/useTasks.ts` | UPDATE | Add pod_id to AgencyMember, update queries |
| `src/components/settings/AgencySettingsModal.tsx` | UPDATE | Add "Team" tab with pod/member management |
| `src/components/settings/TeamManagementTab.tsx` | CREATE | New component for team tab content |
| `src/components/settings/ClientSettingsModal.tsx` | UPDATE | Add pod assignment section |
| `src/components/tasks/CreateTaskModal.tsx` | UPDATE | Group members by pod in dropdown |
| `src/components/tasks/KanbanTaskCard.tsx` | UPDATE | Show pod name in public view |
| `src/components/tasks/TaskDetailModal.tsx` | UPDATE | Show pod name in public view |
| `src/components/tasks/KanbanBoard.tsx` | UPDATE | Pass isPublicView to cards |

---

## User Experience Flow

### Agency Admin Flow:
1. Open Agency Settings → Team tab
2. Create pods (Creatives, Media Buying, etc.)
3. Add team members and assign each to a pod
4. In Client Settings, assign relevant pods to each client
5. Designate one pod (typically Project Management) as the "lead" for client oversight

### Team Member Flow:
1. View Kanban board
2. Filter by their assigned pod
3. See all tasks assigned to them or their pod
4. Task cards show full member names

### Client Flow (Public View):
1. Access their shareable report link
2. View Tasks tab
3. See task cards with pod names only (e.g., "Creatives Pod")
4. Cannot see individual team member names
5. Cannot filter by assignee

---

## Benefits

1. **Organized Teams** - Clear pod structure for agency operations
2. **Client Privacy** - Clients see professional pod names, not individual staff
3. **Workload Visibility** - Filter tasks by pod to see team workload
4. **Client Accountability** - Assign specific pods to specific clients
5. **Lead Designation** - Project Managers clearly assigned to oversee clients
