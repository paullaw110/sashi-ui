# PRD: Inline Organization/Project Editing in Task Table

> **Status:** Ready for Implementation  
> **Created:** 2026-01-30  
> **Priority:** High

---

## Overview

Add Notion-style inline editing for Organization and Project columns in the TaskTable component (Today/Next sections on dashboard). Users can click a blank cell to open a searchable dropdown, select an existing item, or create a new one inline.

---

## User Flow

### Selecting Existing

1. User clicks on Organization or Project cell (blank or populated)
2. Dropdown popover opens with search input
3. User types to filter existing options
4. User clicks an option → **auto-saves** immediately
5. Popover closes, cell shows selected value

### Creating New

1. User clicks on cell, dropdown opens
2. User types a name that doesn't exist
3. First option shows: **"Create [typed text]"**
4. User presses Enter or clicks "Create" option
5. New org/project is created via API
6. Task is updated with new org/project ID
7. Popover closes, cell shows new value

---

## UI Specifications

### Cell States

| State | Display |
|-------|---------|
| Empty | "—" (muted text, clickable) |
| Populated | Org/Project name (clickable) |
| Hover | Subtle background highlight |
| Open | Popover with search + options |

### Popover Content

```
┌─────────────────────────────────┐
│ [Search input: "Link or create..."] │
├─────────────────────────────────┤
│ Create "typed text"   ← only if no match
├─────────────────────────────────┤
│ Select an option                │
│ ─────────────────               │
│ 🏠 House                        │
│ 👀 Personal                     │
│ 📓 imPAC.                       │
│ ...                             │
└─────────────────────────────────┘
```

### Styling (Design System)

- Popover: `bg-[var(--bg-elevated)]` with `border-[var(--border-default)]`
- Input: minimal, no visible border until focus
- Options: hover → `bg-[var(--bg-hover)]`
- Create option: slightly emphasized (bold text or icon)
- Width: match column width or min 200px

---

## Technical Implementation

### Component: `InlineOrgProjectCell`

Props:
```tsx
interface InlineOrgProjectCellProps {
  type: "organization" | "project";
  taskId: string;
  currentValue: string | null;      // Current org/project ID
  currentName: string | null;       // Display name
  organizationId?: string | null;   // For project filtering
  organizations: Organization[];
  projects: Project[];
  onUpdate: (taskId: string, field: string, value: string | null) => Promise<void>;
  onCreateOrg?: (name: string) => Promise<Organization>;
  onCreateProject?: (name: string, orgId: string | null) => Promise<Project>;
}
```

### State Management

1. Use shadcn `Popover` + `Command` (combobox pattern)
2. Local state for search input
3. Call `onUpdate` for existing selections
4. Call `onCreateOrg`/`onCreateProject` then `onUpdate` for new items

### API Calls

**Update Task:**
```
PATCH /api/tasks/:id
{ organizationId: "..." } or { projectId: "..." }
```

**Create Organization:**
```
POST /api/organizations
{ name: "..." }
```

**Create Project:**
```
POST /api/projects
{ name: "...", organizationId: "..." }
```

### Project Filtering Logic

When rendering Project cell:
- If task has `organizationId` → filter projects by that org
- If task has no org → show all projects (user may set project first)
- When creating new project → associate with task's current org (or null)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/TaskTable.tsx` | Replace static cells with `InlineOrgProjectCell` |
| `src/components/InlineOrgProjectCell.tsx` | **New** - reusable inline editor |
| `src/components/Dashboard.tsx` | Pass create handlers down |

---

## Implementation Steps

1. [ ] Create `InlineOrgProjectCell` component
   - Popover + Command pattern
   - Search filtering
   - Create option when no match
   
2. [ ] Integrate into `TaskTable.tsx`
   - Replace Organization column cell
   - Replace Project column cell
   - Wire up update/create handlers

3. [ ] Add create handlers in parent
   - Reuse existing API patterns from `TaskDetailModal`

4. [ ] Test edge cases
   - Empty to selected
   - Selected to different
   - Create new
   - Clear selection (optional: add clear option?)

---

## Success Criteria

- [ ] Clicking blank org/project cell opens dropdown
- [ ] Typing filters existing options
- [ ] Selecting existing auto-saves
- [ ] Typing new name shows "Create [name]" option
- [ ] Enter on create option → creates + saves
- [ ] Project dropdown filtered by org when applicable
- [ ] Matches design system styling

---

## Open Questions

1. **Clear option:** Should there be a way to clear org/project from inline? (Set back to "—")
2. **Keyboard navigation:** Arrow keys to navigate options, Escape to close?
3. **Loading state:** Show spinner while creating/saving?

---

*PRD ready. Implementation estimate: 1-2 hours.*
