# PRD: Auto-Save Task Modal

> **Status:** ✅ Implemented  
> **Commit:** `4d00082`  
> **Date:** 2026-01-30

---

## Overview

Transform the TaskDetailModal from a traditional "edit and save" pattern to an auto-save model where all changes persist immediately. This creates a more fluid, Notion-like editing experience.

---

## Goals

1. **Reduce friction** — No explicit save step required
2. **Prevent data loss** — Changes saved immediately
3. **Cleaner UI** — Remove redundant Cancel/Save buttons
4. **Contextual delete** — Move destructive action to overflow menu

---

## User Experience

### Viewing/Editing Existing Tasks

| Action | Behavior |
|--------|----------|
| Open modal | Load current task data |
| Change any field | Auto-save immediately |
| Close modal (X or click outside) | Just closes, all changes already saved |
| Delete | Via ⋮ menu → "Delete task" |

### Creating New Tasks

| Action | Behavior |
|--------|----------|
| Open "New Task" modal | Empty form displayed |
| Type task name + blur/Enter | Creates task in DB, enables auto-save for other fields |
| Change other fields | Auto-save (after task exists) |
| Close without name | No task created |

---

## UI Changes

### Header
- Three-dot (⋮) menu added next to X close button
- Contains: "Delete task" option
- Shows "Saving..." indicator when save in progress

### Footer
- **Removed:** Cancel button
- **Removed:** Save button
- **New tasks only:** "Create Task" button (until name entered)

---

## Technical Implementation

### Auto-Save Strategy

```typescript
// Each field change triggers immediate save
const handleStatusChange = (newStatus) => {
  setStatus(newStatus);
  if (taskExists) {
    autoSave({ status: newStatus });
  }
};
```

### Description (Debounced)
- 500ms debounce delay
- Prevents excessive API calls while typing

### New Task Creation
- Task created on name blur or Enter key
- `hasCreatedRef` tracks if task exists
- Once created, `localTaskId` enables auto-save for subsequent changes

---

## API Calls

| Trigger | Endpoint | Method |
|---------|----------|--------|
| Field change (existing task) | `/api/tasks/:id` | PATCH |
| Create new task | `/api/tasks` | POST |
| Delete task | `/api/tasks/:id` | DELETE |

---

## Components Modified

- `TaskDetailModal.tsx` — Complete refactor
- Added `dropdown-menu.tsx` (shadcn)

---

## Success Metrics

- [x] No Save/Cancel buttons visible
- [x] Delete in overflow menu
- [x] Changes persist on field blur/change
- [x] "Saving..." indicator visible during save
- [x] New task workflow functional
- [x] Click outside closes without prompt

---

*Implementation complete. This PRD serves as documentation.*
