# Dashboard Feature Reference

## Overview

The Dashboard is the home page and central hub of Sashi UI, displaying today's tasks, tomorrow's tasks, and a week calendar view. It provides a quick overview of what needs attention and allows for rapid task management through inline editing.

## Key Files

| File | Purpose |
|------|---------|
| [src/app/page.tsx](../../src/app/page.tsx) | Server component, fetches initial data |
| [src/components/Dashboard.tsx](../../src/components/Dashboard.tsx) | Main dashboard client component |
| [src/components/TaskTable.tsx](../../src/components/TaskTable.tsx) | Task list table with inline editing |
| [src/components/TimeWeekCalendar.tsx](../../src/components/TimeWeekCalendar.tsx) | Week calendar with hour slots |
| [src/components/TaskDetailModal.tsx](../../src/components/TaskDetailModal.tsx) | Task editing modal (autosave) |

## Data Flow

1. `page.tsx` fetches tasks server-side via Drizzle ORM
2. Tasks serialized (dates to ISO strings) and passed to `Dashboard.tsx`
3. `Dashboard.tsx` manages local state and React Query mutations
4. Changes sync optimistically via TanStack Query

## Key Features

- **Today/Tomorrow sections** - Tasks due today and tomorrow in separate lists
- **Week calendar** - Time-based view with hour slots (Google Calendar style)
- **Inline task creation** - "+ New task" row for quick capture
- **Inline editing** - Click status/priority badges to change via dropdown
- **Drag-and-drop** - Move tasks between days and time slots
- **Task sorting** - Status first (not_started → in_progress → waiting → done), then priority

## Task Sorting Logic

```typescript
// Sort order: status → priority → dueTime
const statusOrder = { not_started: 0, in_progress: 1, waiting: 2, done: 3 };
const priorityOrder = { non_negotiable: 0, critical: 1, high: 2, medium: 3, low: 4 };
```

## API Endpoints Used

- `GET /api/tasks?view=today` - Today's tasks
- `GET /api/tasks?view=week` - Week tasks with date range
- `PATCH /api/tasks/:id` - Update task (status, priority, dueDate, etc.)
- `POST /api/tasks` - Create new task
- `DELETE /api/tasks/:id` - Delete task

## React Query Integration

```typescript
// Optimistic updates pattern
const mutation = useMutation({
  mutationFn: updateTask,
  onMutate: async (newTask) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['tasks']);
    // Snapshot previous value
    const previous = queryClient.getQueryData(['tasks']);
    // Optimistically update
    queryClient.setQueryData(['tasks'], (old) => /* update */);
    return { previous };
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context.previous);
  },
});
```

## Related Components

- `WeekCalendar.tsx` - Simpler week view (cards only)
- `MonthCalendar.tsx` - Month overview
- `TaskSearchFilterBar.tsx` - Filtering (used on Tasks page)

## Related PRDs

- [PRD-sashi-design-system](../PRD-sashi-design-system.md) - Design patterns
- [PRD-task-modal-redesign](../PRD-task-modal-redesign.md) - Modal behavior
