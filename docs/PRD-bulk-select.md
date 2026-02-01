# PRD: Bulk Select & Actions

**Status:** ✅ Complete  
**Created:** 2026-02-01  
**Author:** Sashi  

## Overview

Add multi-select mode to the Tasks list view, enabling users to select multiple tasks and perform bulk actions (delete, change status, set priority, assign to project/org, set due date).

## Problem Statement

Currently, users must edit tasks one at a time. With 170+ tasks, performing the same action on multiple tasks (e.g., marking 10 tasks as done, deleting old tasks, assigning tasks to a project) is tedious and time-consuming.

## User Stories

1. **As a user**, I want to select multiple tasks at once so I can perform bulk actions efficiently
2. **As a user**, I want to quickly mark several tasks as done without opening each one
3. **As a user**, I want to delete multiple obsolete tasks in one action
4. **As a user**, I want to assign multiple tasks to a project/organization at once
5. **As a user**, I want to set the same due date for a batch of related tasks

## Solution

### UX Flow

1. **Enter Multi-Select Mode**
   - Click "Select" button in toolbar (next to filters)
   - Or use keyboard shortcut `⌘+Shift+A` (select all visible)

2. **Select Tasks**
   - Checkboxes appear on the left of each task row
   - Click checkbox to toggle selection
   - Click row (not checkbox) still opens task detail
   - Shift+click for range selection
   - Header checkbox to select/deselect all visible

3. **Bulk Actions Bar**
   - Appears at bottom of screen when tasks are selected
   - Shows count: "X tasks selected"
   - Action buttons: Status | Priority | Project | Due Date | Delete
   - "Cancel" to exit multi-select mode

4. **Exit Multi-Select Mode**
   - Click "Cancel" in bulk actions bar
   - Or press `Escape`
   - Or perform a bulk action (auto-exits after)

### UI Components

#### Select Button (Toolbar)
```
[Calendar] [List] [Organizations] [Migrate Projects] [Search...] [Status ▾] [Priority ▾] [Select]
```
- Ghost button style
- Icon: `CheckSquare` (lucide)
- When active: filled style, shows "Cancel" instead

#### Checkbox Column
- Appears as first column when in multi-select mode
- Width: 40px
- Checkbox style: matches design system (dark bg, lime accent when checked)
- Header checkbox for select all

#### Bulk Actions Bar
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ☑ 5 tasks selected                    [Status ▾] [Priority ▾] [Project ▾] [Due Date] [🗑 Delete] [Cancel] │
└─────────────────────────────────────────────────────────────────────────────┘
```
- Fixed to bottom of viewport
- Dark elevated background (`--bg-elevated`)
- Subtle top border
- Slide up animation on appear

### Bulk Actions

| Action | UI | Behavior |
|--------|-----|----------|
| **Status** | Dropdown | Options: Todo, In Progress, Waiting, Done |
| **Priority** | Dropdown | Options: Non-Negotiable, Critical, High, Medium, Low, Clear |
| **Project** | Dropdown | List of projects + "Clear" option |
| **Organization** | Dropdown | List of orgs + "Clear" option |
| **Due Date** | Date picker | Calendar popup, includes "Clear" |
| **Delete** | Button (red) | Confirmation dialog: "Delete X tasks? This cannot be undone." |

### API Requirements

New endpoint for bulk operations:

```
PATCH /api/tasks/bulk
Body: {
  taskIds: string[],
  updates: {
    status?: string,
    priority?: string | null,
    projectId?: string | null,
    organizationId?: string | null,
    dueDate?: string | null
  }
}

DELETE /api/tasks/bulk
Body: {
  taskIds: string[]
}
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘+Shift+A` | Select all visible tasks |
| `Escape` | Exit multi-select mode |
| `Space` | Toggle selection on focused row |
| `Shift+Click` | Range select |

## Technical Implementation

### Phase 1: Core Selection UI
- [ ] Add `isMultiSelectMode` state to TasksView
- [ ] Add "Select" toggle button to toolbar
- [ ] Render checkbox column when in multi-select mode
- [ ] Track `selectedTaskIds: Set<string>` state
- [ ] Header checkbox for select all
- [ ] Shift+click range selection

### Phase 2: Bulk Actions Bar
- [ ] Create `BulkActionsBar` component
- [ ] Fixed positioning at viewport bottom
- [ ] Slide-up animation (framer-motion or CSS)
- [ ] Task count display
- [ ] Cancel button to exit mode

### Phase 3: Bulk Action Dropdowns
- [ ] Status dropdown with options
- [ ] Priority dropdown with options + Clear
- [ ] Project dropdown (fetch from API) + Clear
- [ ] Organization dropdown + Clear
- [ ] Due date picker with Clear

### Phase 4: API & Mutations
- [ ] Create `PATCH /api/tasks/bulk` endpoint
- [ ] Create `DELETE /api/tasks/bulk` endpoint
- [ ] Add `useBulkUpdateTasks` mutation hook
- [ ] Add `useBulkDeleteTasks` mutation hook
- [ ] Optimistic updates for instant feedback

### Phase 5: Delete Confirmation
- [ ] Confirmation dialog component
- [ ] "Delete X tasks? This cannot be undone."
- [ ] Cancel / Delete buttons
- [ ] Delete button is destructive (red)

## Acceptance Criteria

- [ ] Clicking "Select" enters multi-select mode with checkboxes
- [ ] Checkboxes can be toggled individually
- [ ] Shift+click selects range of tasks
- [ ] Header checkbox selects/deselects all visible
- [ ] Bulk actions bar appears when 1+ tasks selected
- [ ] Status bulk action updates all selected tasks
- [ ] Priority bulk action updates all selected tasks
- [ ] Project bulk action updates all selected tasks
- [ ] Due date bulk action updates all selected tasks
- [ ] Delete shows confirmation, then removes all selected
- [ ] Escape or Cancel exits multi-select mode
- [ ] After bulk action, mode exits and selection clears
- [ ] Optimistic updates make actions feel instant

## Test Scenarios

```gherkin
Feature: Bulk Select & Actions

Scenario: Enter and exit multi-select mode
  Given I am on the Tasks list view
  When I click the "Select" button
  Then checkboxes appear on all task rows
  When I press Escape
  Then checkboxes disappear

Scenario: Select multiple tasks
  Given I am in multi-select mode
  When I click the checkbox on "Task A"
  And I click the checkbox on "Task B"
  Then 2 tasks are selected
  And the bulk actions bar shows "2 tasks selected"

Scenario: Range selection with Shift+click
  Given I am in multi-select mode
  And I have selected "Task A" (row 1)
  When I Shift+click "Task E" (row 5)
  Then tasks A, B, C, D, E are all selected

Scenario: Bulk status change
  Given I have selected 3 tasks
  When I click "Status" in bulk actions
  And I select "Done"
  Then all 3 tasks show status "Done"
  And I exit multi-select mode

Scenario: Bulk delete with confirmation
  Given I have selected 5 tasks
  When I click "Delete" in bulk actions
  Then a confirmation dialog appears
  When I click "Delete" in the dialog
  Then all 5 tasks are removed
  And a toast shows "5 tasks deleted"
```

## Design Specifications

### Colors
- Checkbox unchecked: `--bg-surface` background, `--border-default` border
- Checkbox checked: `--accent-primary` (#EFFF83) background, checkmark dark
- Bulk actions bar: `--bg-elevated` background
- Delete button: `bg-red-600/20 text-red-400` (destructive)

### Animation
- Checkbox column: slide in from left (150ms ease-out)
- Bulk actions bar: slide up from bottom (200ms ease-out)
- Exit animations: reverse of enter

### Spacing
- Checkbox column width: 40px
- Checkbox size: 16x16px
- Bulk actions bar height: 56px
- Bulk actions bar padding: 16px horizontal

## Out of Scope (Future)

- Drag to select (lasso selection)
- Saved selections / task groups
- Bulk edit custom fields
- Export selected tasks
- Keyboard-only navigation in multi-select

## Dependencies

- Existing TasksView component
- React Query mutations
- Date picker component (already exists)
- Dropdown components (already exist)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Accidental bulk delete | Confirmation dialog required |
| Performance with 100+ selections | Batch API calls, optimistic UI |
| Conflicting with row click | Checkbox click stops propagation |

---

**Ready for implementation.** Start with Phase 1 (Core Selection UI).
