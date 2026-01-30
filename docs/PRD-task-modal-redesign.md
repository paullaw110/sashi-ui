# PRD: Notion-Style Task Modal Redesign

## Overview

Redesign the task modal to match Notion's property-based layout with inline editing capabilities. The current form-based modal will be replaced with a vertical property list where each field is directly editable on click/hover.

---

## Goals

1. **Notion-like UX** — Familiar, intuitive property editing
2. **Inline editing** — Click any field to edit in place, no separate "edit mode"
3. **Smart autocomplete** — Organization/Project fields use combobox with search
4. **Instant feedback** — Changes save immediately, optimistically update UI
5. **Minimal friction** — Empty fields show "Empty", click to populate

---

## Design Reference

```
┌─────────────────────────────────────────────────┐
│  [Icon]                                         │
│                                                 │
│  Task Name (large, editable title)              │
│                                                 │
│  ⊡ Status        │ ● Not Started ▾             │
│  📅 Due          │ January 28, 2026             │
│  🏢 Organization │ Empty (click to select)      │
│  📁 Project      │ Empty (click to select)      │
│  ⚡ Priority     │ High ▾                       │
│  🕐 Due Time     │ Empty                        │
│  📝 Created      │ January 28, 2026 9:18 PM     │
│                                                 │
│  ∨ 2 more properties                            │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Description                                    │
│  [Rich text editor area]                        │
│                                                 │
│  ─────────────────────────────────────────────  │
│  [Delete]                        [Close] [Save] │
└─────────────────────────────────────────────────┘
```

---

## Field Behaviors

### 1. Task Name (Title)
- **Display:** Large text at top, similar to Notion page title
- **Edit:** Click to focus, inline text input
- **Save:** On blur or Enter

### 2. Status
- **Display:** Colored badge (● Not Started, ● In Progress, etc.)
- **Edit:** Click opens dropdown with status options
- **Options:** Not Started, In Progress, Waiting, Done

### 3. Due Date
- **Display:** Formatted date (e.g., "January 28, 2026") or "Empty"
- **Edit:** Click opens date picker popover immediately
- **Clear:** X button to remove date

### 4. Organization (Combobox)
- **Display:** Organization name or "Empty"
- **Edit:** Click opens combobox with:
  - Search input at top
  - List of all organizations below
  - Filtered as user types
  - Option to "Create new organization" at bottom
- **Behavior:** Type to filter, click to select, Enter to confirm

### 5. Project (Combobox)
- **Display:** Project name or "Empty"
- **Edit:** Click opens combobox with:
  - Search input at top
  - List of projects (filtered by selected organization if any)
  - Filtered as user types
  - Option to "Create new project" at bottom
- **Dependency:** If organization is selected, only show projects for that org

### 6. Priority
- **Display:** Priority label with color indicator or "Empty"
- **Edit:** Click opens dropdown
- **Options:** Non-Negotiable, Critical, High, Medium, Low

### 7. Due Time
- **Display:** Formatted time (e.g., "2:30 PM") or "Empty"
- **Edit:** Click opens time picker or text input
- **Format:** 12-hour with AM/PM

### 8. Created Time (Read-only)
- **Display:** Full timestamp
- **Edit:** Not editable (display only)

### 9. Description
- **Display:** Rich text content or placeholder
- **Edit:** Click to focus rich text editor
- **Features:** Bold, italic, lists, links, code

---

## Component Architecture

### New Components Needed

```
src/components/
├── TaskDetailModal.tsx          # Main modal container
├── PropertyRow.tsx              # Generic property row wrapper
├── properties/
│   ├── TextProperty.tsx         # Inline text editing
│   ├── SelectProperty.tsx       # Dropdown select
│   ├── ComboboxProperty.tsx     # Searchable combobox
│   ├── DateProperty.tsx         # Date picker
│   ├── TimeProperty.tsx         # Time picker
│   └── BadgeProperty.tsx        # Status/priority badges
```

### shadcn Components to Use

- `Popover` — For all inline editors
- `Command` — For combobox search/select
- `Calendar` — For date picker
- `Input` — For text editing
- `Badge` — For status/priority display

---

## Interaction States

### Property Row States

| State | Appearance |
|-------|------------|
| Default | Label + Value, subtle hover indicator |
| Hover | Slight background highlight, cursor pointer |
| Focused | Input/picker visible, border highlight |
| Saving | Brief loading indicator |
| Error | Red border, error tooltip |

### Empty State

- Show "Empty" in muted text
- On hover: "Click to add [field name]"
- On click: Open appropriate editor

---

## Data Flow

### Optimistic Updates

```typescript
// On field change
1. Update local state immediately (optimistic)
2. Show value in UI
3. Fire API request in background
4. On success: Keep optimistic value
5. On error: Revert to previous value, show error toast
```

### Auto-save Behavior

- **Text fields:** Save on blur or after 500ms debounce
- **Select fields:** Save immediately on selection
- **Date/time:** Save immediately on selection

---

## API Changes

No API changes needed — existing PATCH `/api/tasks/[id]` handles partial updates.

---

## Implementation Phases

### Phase 1: Layout & Structure (Day 1)
- [ ] Create `TaskDetailModal` shell
- [ ] Implement `PropertyRow` component
- [ ] Vertical layout with icons and labels
- [ ] Wire up to existing task data

### Phase 2: Inline Editing (Day 2)
- [ ] `TextProperty` for task name
- [ ] `SelectProperty` for status, priority
- [ ] `DateProperty` with calendar popover
- [ ] `TimeProperty` with time input

### Phase 3: Combobox Fields (Day 3)
- [ ] `ComboboxProperty` base component
- [ ] Organization combobox with search
- [ ] Project combobox with org filtering
- [ ] "Create new" option in comboboxes

### Phase 4: Polish & Description (Day 4)
- [ ] Empty states with placeholders
- [ ] Keyboard navigation (Tab between fields)
- [ ] Description editor integration
- [ ] Error handling and loading states

### Phase 5: Testing & Cleanup (Day 5)
- [ ] E2E tests for inline editing
- [ ] Unit tests for property components
- [ ] Remove old TaskModal
- [ ] Documentation

---

## Success Metrics

- **Editing speed:** Fewer clicks to update a field
- **Error rate:** Reduced save failures (optimistic + retry)
- **User satisfaction:** Feels as fluid as Notion

---

## Out of Scope (Future)

- Sub-tasks / Relations
- Comments
- Activity history
- Custom properties
- Keyboard-only editing (Cmd+Enter to save, etc.)

---

## Technical Notes

### Combobox Implementation

Use shadcn `Command` component:

```tsx
<Popover>
  <PopoverTrigger>
    <div>{selectedValue || "Empty"}</div>
  </PopoverTrigger>
  <PopoverContent>
    <Command>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results</CommandEmpty>
        <CommandGroup>
          {items.map(item => (
            <CommandItem onSelect={() => handleSelect(item)}>
              {item.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup>
          <CommandItem onSelect={handleCreateNew}>
            + Create new
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

### Property Row Pattern

```tsx
function PropertyRow({ 
  icon: Icon, 
  label, 
  children,
  isEmpty 
}: PropertyRowProps) {
  return (
    <div className="flex items-center py-2 hover:bg-[#161616] rounded px-2 -mx-2 group">
      <div className="flex items-center gap-2 w-32 shrink-0">
        <Icon size={14} className="text-[#525252]" />
        <span className="text-xs text-[#737373]">{label}</span>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Complex state management | Use React Query for server state, local state for UI |
| Accessibility | Ensure keyboard navigation, ARIA labels |
| Mobile UX | Popovers may need adjustment for touch |
| Performance | Debounce saves, lazy load organizations/projects |

---

## Appendix: Current vs New

### Current TaskModal
- Form-based layout
- All fields visible at once
- Explicit Save/Cancel buttons
- Dropdowns for all select fields

### New TaskDetailModal
- Property list layout
- Inline editing on click
- Auto-save on change
- Combobox with search for relations
