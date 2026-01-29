

# Task Detail Modal Redesign

This plan transforms the current task detail modal into a unified discussion-style layout that matches the reference design you provided, with file previews at the top, a merged comment/history thread, and proper attribution based on who's logged in.

---

## Overview

The new design will have:

1. **Header Section** - Task title, client name, priority & status badges
2. **Files Gallery** - Visual thumbnail previews of attachments at the top (images, PDFs, videos)
3. **Unified Discussion Thread** - Comments and history merged chronologically with proper author attribution
4. **Comment Input** - Text and voice input at the bottom

---

## Key Changes

### 1. Layout Restructure
- Remove the 4-tab navigation (Details, Comments, Files, History)
- Replace with a single scrollable view:
  - Project details summary at the top
  - File preview gallery (thumbnails)
  - Unified discussion thread below

### 2. File Previews with Lightbox
- Display files as visual thumbnails in a horizontal gallery at the top
- Support preview types:
  - **Images** (jpg, png, gif, webp): Show actual thumbnail
  - **PDFs**: Show PDF icon with file name
  - **Videos**: Show video thumbnail or video icon
- Clicking a file opens a fullscreen lightbox modal (not a new tab)
- Lightbox includes download button
- Upload button remains at the end of the gallery

### 3. Unified Discussion Thread
- Merge comments and history entries into one chronological feed
- Each entry shows:
  - Author avatar (initials)
  - Author name + timestamp
  - Content (text comment, voice note player, or history action)
- **Agency view**: Shows individual team member names (from `useTeamMember` context)
- **Client/Public view**: Shows pod name or "Client" label

### 4. Author Attribution Integration
- Import and use `useTeamMember` hook to get current logged-in member
- When agency member adds a comment: Use `currentMember.name`
- When client (public view) adds a comment: Use pod assignment or "Client"

---

## Technical Implementation

### New Component: `FilePreviewLightbox.tsx`
A modal component that:
- Displays the selected file in fullscreen
- Supports image rendering, video player, and PDF embed
- Includes navigation arrows for multiple files
- Download button

### Modified: `TaskDetailModal.tsx`
Key changes:
1. Remove `Tabs` component
2. Add file preview gallery section with thumbnails
3. Create unified timeline by merging and sorting `comments` + `history` by `created_at`
4. Import `useTeamMember` and use `currentMember.name` for author attribution
5. Add file lightbox state management
6. Adjust layout for scrollable single-panel design

### Data Flow

```text
Task Opens
    │
    ├─► Fetch task details
    ├─► Fetch files → Display as thumbnails
    ├─► Fetch comments + history → Merge & sort by timestamp
    │
    ▼
Unified View:
┌─────────────────────────────────────────┐
│  Title: Update email headers...         │
│  Client: Blue Capital                   │
│  [HIGH] [TODO]                          │
├─────────────────────────────────────────┤
│  📎 Files (6)                           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  [+]   │
│  │ IMG │ │ IMG │ │ PDF │ │ IMG │        │
│  └─────┘ └─────┘ └─────┘ └─────┘        │
├─────────────────────────────────────────┤
│  💬 Discussion                          │
│  ─────────────────────────              │
│  [AV] Alex V. · Jan 28, 4:45 PM         │
│  "Please review the updated headers"    │
│  ─────────────────────────              │
│  ⟲ Status changed: todo → review        │
│     Jan 28, 5:00 PM                     │
│  ─────────────────────────              │
│  [CL] Client · Jan 29, 9:00 AM          │
│  "Looks good, approved!"                │
├─────────────────────────────────────────┤
│  [Post a comment...] [🎙] [➤]           │
└─────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/tasks/FilePreviewLightbox.tsx` | Create | Fullscreen file preview modal with download |
| `src/components/tasks/TaskDetailModal.tsx` | Major Update | New layout with unified thread & file gallery |
| `src/components/tasks/TaskDiscussionVoiceNote.tsx` | Minor Update | Accept member context for attribution |

---

## Technical Details

### Unified Timeline Logic
```typescript
type TimelineEntry = 
  | { type: 'comment'; data: TaskComment; timestamp: Date }
  | { type: 'history'; data: TaskHistory; timestamp: Date };

const timeline = useMemo(() => {
  const entries: TimelineEntry[] = [
    ...comments.map(c => ({ 
      type: 'comment' as const, 
      data: c, 
      timestamp: new Date(c.created_at) 
    })),
    ...history.map(h => ({ 
      type: 'history' as const, 
      data: h, 
      timestamp: new Date(h.created_at) 
    })),
  ];
  return entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}, [comments, history]);
```

### File Type Detection for Previews
```typescript
const getFilePreviewType = (fileType: string | null, fileName: string) => {
  if (fileType?.startsWith('image/')) return 'image';
  if (fileType?.startsWith('video/')) return 'video';
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) return 'pdf';
  return 'document';
};
```

### Author Name Resolution
```typescript
// Agency view: Use current team member name
// Public view: Use pod name or "Client"
const getAuthorName = () => {
  if (isPublicView) {
    // For clients, check if there's an assigned pod name
    return task.assigned_client_name || 'Client';
  }
  return currentMember?.name || 'Agency';
};
```

---

## Summary

This redesign:
- Creates a cleaner, single-panel layout matching your reference
- Shows files as visual thumbnails with inline lightbox preview
- Merges comments and history into one chronological discussion
- Uses proper author attribution based on logged-in team member
- Maintains the agency vs client privacy distinction (pod names for clients)

