

## Subtask Enhancements: Due Dates, Priorities, Assignees, Delete, and API Support

### What will change

1. **Subtask due dates and priorities** -- Each subtask row will show an inline priority badge and a due date, both editable via dropdowns/popovers directly on the row.

2. **Subtask assignees** -- Each subtask will have its own `MultiAssigneeSelector` (the same component used on parent tasks), so team members or pods can be assigned independently per subtask.

3. **Delete subtasks** -- The existing delete button (currently broken -- it calls `updateTask` instead of `deleteTask`) will be fixed to properly delete the subtask.

4. **Expanded inline editing** -- Clicking a subtask title enters edit mode (already working). Priority and due date will be editable inline via small select/popover controls that appear on hover or always display.

5. **API (external-data-api) support** -- The `task_assignees` table is already in the allowed tables list. Subtasks are already accessible via the `tasks` table (they have `parent_task_id` set). No API changes are needed -- external tools can already create/update/delete subtasks and their assignees through the existing CRUD endpoints.

### Technical Details

**Fix: Delete button (line 747)**
- Change `updateTask.mutateAsync({ id: subtask.id })` to `deleteTask.mutateAsync(subtask.id)` so the trash icon actually deletes the subtask.

**Subtask row UI refactor (`TaskDetailPanel.tsx`)**
Each subtask row will be expanded from a single-line layout to a richer layout:

```
[check] Title (click to edit)    [Priority badge] [Due: Mar 15] [Assignee avatars] [Trash]
```

- Priority: a small `Select` dropdown (low/medium/high) that updates via `updateTask`
- Due date: a `Popover` with `Calendar` picker, same pattern as parent task
- Assignee: render `MultiAssigneeSelector` with the subtask's ID
- All controls compact (h-6/h-7) to keep rows tight

**Subtask creation form enhancement**
The "Add subtask" inline form will be expanded to optionally set priority and due date at creation time (default: inherit parent's priority, no due date).

**Files to modify:**
- `src/components/tasks/TaskDetailPanel.tsx` -- Main changes: fix delete, add priority/due date/assignee controls per subtask row, enhance creation form
- No database migrations needed (tasks table already has `priority`, `due_date`, `parent_task_id` columns; `task_assignees` table already supports per-task assignments)
- No edge function changes needed (external API already covers tasks and task_assignees tables)

