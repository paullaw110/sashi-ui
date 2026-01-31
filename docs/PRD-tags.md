# PRD: Task Tagging System

**Status:** ✅ Complete (2026-01-31)

## Overview

Add a flexible tagging system to organize and filter tasks across organizations and projects. Tags provide a cross-cutting way to categorize tasks that doesn't fit into the hierarchical org → project structure.

---

## Goals

1. **Flexible organization** — Group related tasks regardless of project
2. **Quick filtering** — Find all tasks with a specific tag instantly
3. **Visual identification** — Color-coded tags for at-a-glance recognition
4. **Lightweight** — Adding tags should be frictionless

---

## User Stories

### Core
- As a user, I want to add tags to tasks (e.g., #urgent, #waiting-on, #quick-win)
- As a user, I want to filter my task list by one or more tags
- As a user, I want to see all tags on a task at a glance
- As a user, I want to create new tags on the fly while tagging

### Management
- As a user, I want to see all my tags in one place
- As a user, I want to assign colors to tags
- As a user, I want to rename or delete tags
- As a user, I want to see how many tasks use each tag

### Power User
- As a user, I want to filter by multiple tags (AND/OR)
- As a user, I want to add tags via keyboard shortcut
- As a user, I want to bulk-add tags to multiple tasks

---

## Data Model

### Tags Table
```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,  -- hex color like #FF5733
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Task-Tags Junction Table
```sql
CREATE TABLE task_tags (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (task_id, tag_id)
);
```

### Migration from Current Schema
Currently, tasks have a `tags` column storing JSON. We'll migrate to the relational model:
1. Create new tables
2. Parse existing JSON tags
3. Create tag records
4. Create junction records
5. Drop old `tags` column

---

## UI Components

### 1. Tag Badge
Small pill showing tag name with optional color.

```
┌──────────┐
│ #urgent  │  ← colored background based on tag.color
└──────────┘
```

### 2. Tag Input (Inline)
Appears in task detail modal and inline editing.

```
┌─────────────────────────────────────────────┐
│ Tags: [#urgent ×] [#client ×] [+ Add tag]   │
└─────────────────────────────────────────────┘
```

Clicking "+ Add tag" opens a command palette:
```
┌─────────────────────────────────┐
│ 🔍 Search or create tag...     │
├─────────────────────────────────┤
│   #urgent                       │
│   #waiting-on                   │
│   #quick-win                    │
│   #client                       │
├─────────────────────────────────┤
│ + Create "#meeting"             │  ← if no match
└─────────────────────────────────┘
```

### 3. Tag Filter (Task List)
Add to existing filter bar.

```
┌────────────────────────────────────────────────────────┐
│ Status [All ▼]  Priority [All ▼]  Tags [#urgent ▼]    │
└────────────────────────────────────────────────────────┘
```

### 4. Tag Manager (Settings)
Dedicated page or modal for managing all tags.

```
┌─────────────────────────────────────────────────────────┐
│ Tags                                        [+ New Tag] │
├─────────────────────────────────────────────────────────┤
│ 🔴 #urgent           12 tasks                    [···]  │
│ 🟡 #waiting-on        8 tasks                    [···]  │
│ 🟢 #quick-win         5 tasks                    [···]  │
│ 🔵 #client           15 tasks                    [···]  │
│ ⚪ #personal          3 tasks                    [···]  │
└─────────────────────────────────────────────────────────┘

[···] menu: Rename, Change color, Delete
```

---

## Interaction Patterns

### Adding Tags
1. **From task modal:** Click tag area → type → select or create
2. **From task table:** Click tag cell → same popover
3. **Keyboard:** `t` to focus tag input when task is selected

### Removing Tags
- Click the × on any tag badge

### Creating Tags
- Type a name that doesn't exist → "Create #name" option appears
- Default color assigned (can change later)

### Default Colors
Rotate through a preset palette for new tags:
```
#EF4444 (red)
#F59E0B (amber)
#10B981 (green)
#3B82F6 (blue)
#8B5CF6 (purple)
#EC4899 (pink)
#6B7280 (gray)
```

---

## API Endpoints

### Tags CRUD
```
GET    /api/tags              # List all tags with task counts
POST   /api/tags              # Create tag { name, color? }
PATCH  /api/tags/:id          # Update tag { name?, color? }
DELETE /api/tags/:id          # Delete tag (removes from all tasks)
```

### Task Tags
```
GET    /api/tasks/:id/tags    # Get tags for a task
POST   /api/tasks/:id/tags    # Add tag { tagId } or { name } to create+add
DELETE /api/tasks/:id/tags/:tagId  # Remove tag from task
```

### Filtering
```
GET    /api/tasks?tags=id1,id2&tagMode=and|or
```

---

## Implementation Plan

### Phase 1: Database & API (Day 1)
- [ ] Add Drizzle schema for tags and task_tags
- [ ] Run migration
- [ ] Create API routes for tags CRUD
- [ ] Create API routes for task-tag management
- [ ] Update task API to include tags in response

### Phase 2: Tag Display (Day 1-2)
- [ ] Create TagBadge component
- [ ] Display tags in TaskTable
- [ ] Display tags in TaskDetailModal
- [ ] Display tags in WeekCalendar cards

### Phase 3: Tag Editing (Day 2)
- [ ] Create TagInput component (search + create)
- [ ] Add to TaskDetailModal
- [ ] Add inline editing in TaskTable
- [ ] Keyboard shortcut support

### Phase 4: Filtering (Day 3)
- [ ] Add tag filter to task list header
- [ ] Implement AND/OR filtering logic
- [ ] Update URL params for shareable filters

### Phase 5: Tag Manager (Day 3-4)
- [ ] Create Tag Manager page/modal
- [ ] Color picker for tags
- [ ] Rename functionality
- [ ] Delete with confirmation
- [ ] Usage count display

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Delete tag used by tasks | Remove from all tasks, show count in confirmation |
| Create duplicate tag name | Show error "Tag already exists" |
| Tag name with spaces | Convert to kebab-case (#my-tag) |
| Tag name with special chars | Strip to alphanumeric + hyphen |
| Very long tag name | Truncate display at 20 chars |
| Many tags on one task | Wrap or show "+N more" |

---

## Future Enhancements

- **Tag groups** — Organize tags into categories
- **Tag templates** — Preset tag combinations for common workflows
- **Auto-tagging** — Rules to auto-apply tags based on task content
- **Tag shortcuts** — Assign keyboard shortcuts to favorite tags
- **Tag views** — Save filtered views as "smart lists"

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Tags created per user | > 5 |
| Tasks with tags | > 30% |
| Filter by tag usage | > 10% of sessions |
| Tag creation time | < 2 seconds |

---

## Open Questions

1. **Shared tags?** — If we add collaboration, are tags per-user or shared?
2. **Tag hierarchy?** — Support parent/child tags? (e.g., #work/meetings)
3. **Emoji tags?** — Allow emoji in tag names? (#🔥)
4. **Import from Notion?** — Notion uses multi-select, map to tags?
