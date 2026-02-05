# Tasks Feature Reference

## Overview

The Tasks feature is the core of Sashi UI, providing comprehensive task management with CRUD operations, subtasks, tags, bulk actions, and AI-powered PRD generation. Tasks can be organized by organization, project, status, priority, and due date.

## Key Files

| File | Purpose |
|------|---------|
| [src/app/tasks/page.tsx](../../src/app/tasks/page.tsx) | Tasks page server component |
| [src/components/TasksView.tsx](../../src/components/TasksView.tsx) | Main tasks view with filters |
| [src/components/TaskTable.tsx](../../src/components/TaskTable.tsx) | Sortable task table |
| [src/components/TaskDetailModal.tsx](../../src/components/TaskDetailModal.tsx) | Task editing modal (autosave) |
| [src/components/TaskSearchFilterBar.tsx](../../src/components/TaskSearchFilterBar.tsx) | Search and multi-filter |
| [src/components/BulkActionsBar.tsx](../../src/components/BulkActionsBar.tsx) | Bulk selection actions |
| [src/components/SubtaskList.tsx](../../src/components/SubtaskList.tsx) | Subtask management |
| [src/lib/hooks/use-tasks.ts](../../src/lib/hooks/use-tasks.ts) | Task CRUD React Query hooks |
| [src/app/api/tasks/route.ts](../../src/app/api/tasks/route.ts) | Tasks API endpoint |

## Database Schema

```sql
tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id),
  organization_id TEXT REFERENCES organizations(id),
  priority TEXT,           -- non_negotiable | critical | high | medium | low
  status TEXT DEFAULT 'not_started',  -- not_started | in_progress | waiting | done
  due_date INTEGER,        -- timestamp_ms
  due_time TEXT,           -- HH:mm format
  duration INTEGER,        -- minutes
  tags TEXT,               -- JSON array
  description TEXT,        -- HTML from rich editor
  prd TEXT,                -- Generated PRD markdown
  prd_context TEXT,        -- Original context
  prd_chat TEXT,           -- JSON clarification Q&A
  parent_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | List tasks with filters |
| `/api/tasks` | POST | Create task |
| `/api/tasks/:id` | GET | Get single task |
| `/api/tasks/:id` | PATCH | Update task |
| `/api/tasks/:id` | DELETE | Delete task |
| `/api/tasks/:id/subtasks` | GET | Get subtasks |
| `/api/tasks/:id/subtasks` | POST | Create subtask |
| `/api/tasks/:id/tags` | POST | Add tag |
| `/api/tasks/:id/tags` | DELETE | Remove tag |
| `/api/tasks/:id/generate-prd` | POST | Generate AI PRD |
| `/api/tasks/:id/finalize-prd` | POST | Finalize PRD |
| `/api/tasks/bulk` | POST | Batch operations |

## Query Parameters

```
GET /api/tasks?view=today          // Tasks due today
GET /api/tasks?view=week           // Tasks for current week
GET /api/tasks?view=all            // All tasks
GET /api/tasks?status=in_progress  // Filter by status
GET /api/tasks?projectId=xxx       // Filter by project
GET /api/tasks?organizationId=xxx  // Filter by organization
```

## Key Features

### Task Management
- **Autosave modal** - Changes save immediately (no Save/Cancel)
- **Inline editing** - Click status/priority in table to change
- **Rich description** - HTML content via TipTap editor
- **Duration tracking** - Time estimates in minutes

### Organization
- **Subtasks** - Hierarchical tasks with parentId
- **Tags** - Many-to-many via task_tags junction
- **Projects** - Group tasks by project
- **Organizations** - Top-level grouping

### Bulk Operations
- **Selection** - Shift+click range, Cmd+click individual
- **Batch updates** - Status, priority, due date
- **Keyboard** - Escape to deselect

### AI PRD Generation
- **Two-step workflow** - Generate questions → Finalize PRD
- **Context preservation** - prdContext stores original input
- **Chat history** - prdChat stores clarification Q&A

## Filtering

```typescript
// TaskSearchFilterBar filters
interface TaskFilters {
  search: string;           // Text search
  status: string[];         // Multiple statuses
  priority: string[];       // Multiple priorities
  projectId: string | null; // Single project
  organizationId: string | null; // Single org
}
```

## Related Components

- `TagInput.tsx` - Tag selection component
- `TagBadge.tsx` - Tag display
- `InlineEditCell.tsx` - Inline table editing
- `PRDCreator.tsx` - AI PRD generation UI

## Related PRDs

- [PRD-task-modal-redesign](../PRD-task-modal-redesign.md)
- [PRD-bulk-select](../PRD-bulk-select.md)
- [PRD-tags](../PRD-tags.md)
- [PRD-ai-prd-workflow](../PRD-ai-prd-workflow.md)
