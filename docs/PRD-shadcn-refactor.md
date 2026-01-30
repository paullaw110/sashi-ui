# PRD: shadcn/ui Refactor

**Status:** Draft  
**Author:** Sashi  
**Created:** 2026-01-29  
**Last Updated:** 2026-01-29

---

## Executive Summary

Refactor sashi-ui from hand-rolled Tailwind components to shadcn/ui primitives. This reduces maintenance burden, standardizes component patterns, and provides accessible, well-tested building blocks while preserving the existing dark monochrome design system.

**Expanded scope includes:**
- **Form validation** via react-hook-form + zod (type-safe schemas, automatic error handling)
- **Advanced data tables** via @tanstack/react-table (sorting, filtering, pagination, row selection)
- **Command palette** via cmdk (⌘K keyboard-first navigation)

---

## Current State

### Tech Stack
- **Framework:** Next.js 16.1 (App Router)
- **React:** 19.2
- **Styling:** Tailwind CSS v4 (raw classes, no component library)
- **Icons:** lucide-react
- **State:** React Query, React hooks
- **Utilities:** clsx, tailwind-merge (`cn()` already exists)

### Component Inventory (25 components, ~230K chars)

| Component | Lines | Complexity | shadcn Overlap |
|-----------|-------|------------|----------------|
| CalendarView.tsx | 1,100+ | High | Calendar, Popover, Dialog |
| MonthCalendar.tsx | 600+ | High | Calendar primitives |
| WeekCalendar.tsx | 500+ | High | Calendar primitives |
| TaskModal.tsx | 400+ | Medium | Dialog, Select, Input, Button |
| TaskSidePanel.tsx | 350+ | Medium | Sheet, Input, Select |
| TasksView.tsx | 500+ | High | Tabs, Select, Button |
| TaskTable.tsx | 250+ | Medium | Table, Checkbox |
| LeadsTable.tsx | 300+ | Medium | Table, Badge, Button |
| LeadSidePanel.tsx | 450+ | Medium | Sheet, Input, Textarea |
| OrganizationModal.tsx | 180+ | Low | Dialog, Input, Button |
| OrganizationManager.tsx | 180+ | Low | Card, Button |
| SkillsManager.tsx | 300+ | Medium | Card, Switch, Collapsible |
| MigrationWizard.tsx | 200+ | Medium | Dialog, Progress, Button |
| QuickAddTask.tsx | 190+ | Low | Popover, Input |
| RichEditor.tsx | 150+ | Medium | (keep Tiptap) |
| InboxView.tsx | 210+ | Low | Card, Badge |
| NotesView.tsx | 300+ | Medium | Card, Dialog, Input |
| Dashboard.tsx | 140+ | Low | Card |
| Sidebar.tsx | 130+ | Low | Navigation primitives |
| AppLayout.tsx | 120+ | Low | Layout |
| StatusIndicator.tsx | 80+ | Low | Badge variant |
| Breadcrumb.tsx | 35+ | Low | Breadcrumb |
| CodePlayground.tsx | 500+ | High | Tabs, ResizablePanel |
| QueueBoard.tsx | 70+ | Low | Card |
| LeadsView.tsx | 85+ | Low | Layout |

### Current Design System

```css
:root {
  --bg-base: #0c0c0c;
  --bg-elevated: #111111;
  --bg-surface: #161616;
  --bg-hover: #1c1c1c;
  --bg-active: #222222;
  
  --border-subtle: #1a1a1a;
  --border-default: #222222;
  --border-strong: #333333;
  
  --text-primary: #f5f5f5;
  --text-secondary: #a3a3a3;
  --text-tertiary: #737373;
  --text-quaternary: #525252;
  
  --accent: #e5e5e5;
  --accent-muted: #a3a3a3;
}
```

---

## Goals

### Primary
1. **Reduce maintenance** — Replace ~15K lines of custom component code with battle-tested primitives
2. **Improve accessibility** — shadcn uses Radix UI (ARIA-compliant, keyboard nav, focus management)
3. **Standardize patterns** — Consistent API for dialogs, dropdowns, forms, etc.
4. **Preserve design** — Keep the dark monochrome aesthetic, just map to shadcn's CSS variable system

### Secondary
1. Easier onboarding for contributors
2. Built-in responsive patterns
3. TypeScript-first component APIs
4. Animation primitives via tailwindcss-animate

### Non-Goals
- Complete visual redesign
- Adding new features during refactor
- Changing data layer (React Query, Drizzle)
- Replacing specialized libs (dnd-kit, Tiptap)

---

## shadcn Components to Install

### Phase 1: Foundations (Priority: Critical)
These are used across nearly every component.

| Component | Usage | Est. Impact |
|-----------|-------|-------------|
| `button` | Every interactive element | High |
| `dialog` | TaskModal, OrganizationModal, MigrationWizard | High |
| `input` | All forms | High |
| `label` | All forms | Medium |
| `select` | Priority, status, project pickers | High |
| `popover` | Quick add, date picker | High |
| `tooltip` | Various hover states | Medium |

### Phase 2: Layout & Navigation
| Component | Usage | Est. Impact |
|-----------|-------|-------------|
| `sheet` | TaskSidePanel, LeadSidePanel | High |
| `card` | Dashboard, cards, organization cards | Medium |
| `tabs` | CalendarView, CodePlayground | Medium |
| `breadcrumb` | Already exists, standardize | Low |
| `separator` | Section dividers | Low |

### Phase 3: Data Display
| Component | Usage | Est. Impact |
|-----------|-------|-------------|
| `table` | TaskTable, LeadsTable | High |
| `badge` | Status, priority, tags | Medium |
| `calendar` | Date picker integration | Medium |
| `progress` | MigrationWizard | Low |
| `skeleton` | Loading states | Low |

### Phase 4: Forms & Feedback
| Component | Usage | Est. Impact |
|-----------|-------|-------------|
| `checkbox` | Task completion, table selection | Medium |
| `switch` | Settings toggles | Low |
| `textarea` | Description fields | Low |
| `form` | Validation wrapper (optional) | Low |
| `sonner` | Already using, keep | — |

### Phase 5: Advanced (As Needed)
| Component | Usage | Est. Impact |
|-----------|-------|-------------|
| `command` | Command palette (future) | Low |
| `dropdown-menu` | Context menus | Medium |
| `context-menu` | Right-click actions | Low |
| `collapsible` | SkillsManager sections | Low |
| `resizable` | CodePlayground panels | Medium |

---

## Theme Integration

### CSS Variable Mapping

Map current variables to shadcn's expected names:

```css
:root {
  /* shadcn expects these */
  --background: 0 0% 5%;          /* #0c0c0c */
  --foreground: 0 0% 96%;         /* #f5f5f5 */
  
  --card: 0 0% 7%;                /* #111111 */
  --card-foreground: 0 0% 96%;
  
  --popover: 0 0% 9%;             /* #161616 */
  --popover-foreground: 0 0% 96%;
  
  --primary: 0 0% 90%;            /* #e5e5e5 */
  --primary-foreground: 0 0% 5%;
  
  --secondary: 0 0% 13%;          /* #222222 */
  --secondary-foreground: 0 0% 96%;
  
  --muted: 0 0% 11%;              /* #1c1c1c */
  --muted-foreground: 0 0% 45%;   /* #737373 */
  
  --accent: 0 0% 13%;
  --accent-foreground: 0 0% 96%;
  
  --destructive: 0 62% 30%;       /* red, muted */
  --destructive-foreground: 0 0% 96%;
  
  --border: 0 0% 13%;             /* #222222 */
  --input: 0 0% 13%;
  --ring: 0 0% 45%;
  
  --radius: 0.375rem;             /* 6px, subtle rounding */
}
```

### Font Preservation
Keep current fonts:
- **Body:** Inter
- **Display:** Playfair Display (`.font-display`)

---

## Implementation Plan

### Phase 1: Setup (1-2 hours)
1. Initialize shadcn/ui: `npx shadcn@latest init`
2. Configure `components.json` for dark theme, custom path
3. Map CSS variables in globals.css
4. Install Phase 1 components
5. Install additional deps:
   ```bash
   npm install react-hook-form zod @hookform/resolvers @tanstack/react-table
   ```

### Phase 2: Atomic Components (4-6 hours)
Refactor in dependency order (bottom-up):

1. **Button** — Create variants matching current styles
2. **Input/Label** — Standardize form inputs
3. **Select** — Replace custom dropdowns
4. **Dialog** — Replace modal implementations
5. **Popover** — Replace custom popovers

### Phase 3: Complex Components (8-12 hours)
Refactor larger components one at a time:

1. **TaskModal** → Dialog + Form components
2. **TaskSidePanel** → Sheet component
3. **OrganizationModal** → Dialog
4. **LeadSidePanel** → Sheet
5. **QuickAddTask** → Popover + Form

### Phase 4: Tables & Lists (4-6 hours)
1. **TaskTable** → Table primitives
2. **LeadsTable** → Table primitives
3. Add Checkbox for selection

### Phase 5: Layout & Navigation (2-4 hours)
1. **Tabs** for CalendarView, CodePlayground
2. **Card** for Dashboard, Inbox
3. **Breadcrumb** standardization

### Phase 6: Polish (2-4 hours)
1. Add Skeleton loading states
2. Audit accessibility (keyboard nav, focus)
3. Add missing Tooltip instances
4. Remove dead custom code

---

## Migration Strategy

### Approach: Incremental
- **Do NOT rewrite everything at once**
- Migrate one component at a time
- Each component is a separate PR
- Old and new can coexist during migration

### File Structure

```
src/
├── components/
│   ├── ui/              # shadcn primitives (auto-generated)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── TaskModal.tsx    # Uses ui/dialog, ui/input, etc.
│   ├── Sidebar.tsx
│   └── ...
├── lib/
│   └── utils.ts         # cn() already exists
```

### Testing Each Migration
1. Visual diff (screenshot before/after)
2. Keyboard navigation test
3. Screen reader spot check
4. Responsive check (mobile/tablet)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing styles | Medium | High | Incremental migration, visual testing |
| Tailwind v4 compatibility | Low | Medium | shadcn supports v4 as of 2025 |
| Bundle size increase | Low | Low | shadcn is copy-paste, tree-shakes well |
| Learning curve | Low | Low | shadcn docs are excellent |
| dnd-kit conflicts | Low | Medium | Keep dnd-kit separate from shadcn |

---

## Success Metrics

1. **Code reduction:** Target 30-40% fewer lines in component files
2. **Accessibility score:** Lighthouse accessibility ≥ 95
3. **Build time:** No regression (current: ~20s)
4. **Bundle size:** < 5% increase
5. **Visual parity:** No unintended design changes

---

## Timeline Estimate

| Phase | Effort | Elapsed Time |
|-------|--------|--------------|
| Setup | 2h | Day 1 |
| Atomic Components | 6h | Day 1-2 |
| Complex Components | 12h | Day 2-4 |
| Form Validation (RHF + zod) | 6h | Day 4-5 |
| Data Tables (TanStack Table) | 8h | Day 5-6 |
| Command Palette | 6h | Day 7 |
| Layout & Navigation | 4h | Day 7-8 |
| Polish | 4h | Day 8 |
| **Total** | **~48h** | **~8 days** |

*Assumes focused work. Can be spread across 2-3 weeks with other tasks.*

---

## Additional Integrations (Confirmed)

### 1. Form Validation: react-hook-form + zod

**Install:**
```bash
npm install react-hook-form zod @hookform/resolvers
npx shadcn@latest add form
```

**Benefits:**
- Type-safe form schemas with zod
- Automatic error messages
- Field-level validation
- Optimized re-renders (only changed fields)
- Works seamlessly with shadcn's Form component

**Apply to:**
- TaskModal (task creation/editing)
- OrganizationModal
- LeadSidePanel
- QuickAddTask
- Any future forms

**Example pattern:**
```tsx
const taskSchema = z.object({
  name: z.string().min(1, "Task name required"),
  dueDate: z.date().optional(),
  priority: z.enum(["non-negotiable", "critical", "high", "medium", "low"]).optional(),
  status: z.enum(["not_started", "in_progress", "waiting", "done"]),
});

type TaskFormData = z.infer<typeof taskSchema>;
```

---

### 2. Data Tables: @tanstack/react-table

**Install:**
```bash
npm install @tanstack/react-table
npx shadcn@latest add table
```

**Benefits:**
- Headless — full control over markup
- Column sorting (single/multi)
- Filtering (global and column-level)
- Pagination
- Row selection
- Column visibility toggle
- Column resizing
- Virtualization-ready for large datasets

**Apply to:**
- TaskTable → Full-featured task management table
- LeadsTable → CRM-style lead management

**Features to implement:**
| Feature | TaskTable | LeadsTable |
|---------|-----------|------------|
| Sorting | ✓ by date, priority, name | ✓ by name, status, date |
| Filtering | ✓ by status, project | ✓ by status, organization |
| Pagination | ✓ (if >50 tasks) | ✓ (if >50 leads) |
| Row selection | ✓ bulk actions | ✓ bulk actions |
| Column visibility | Optional | ✓ |

**Estimated addition:** +4-6 hours to implementation

---

### 3. Command Palette: cmdk

**Install:**
```bash
npx shadcn@latest add command
```

**Benefits:**
- Keyboard-first navigation (⌘K / Ctrl+K)
- Fuzzy search across actions
- Recent commands
- Nested command groups
- Extensible with custom actions

**Command groups to implement:**

| Group | Commands |
|-------|----------|
| **Navigation** | Go to Tasks, Calendar, Leads, Dashboard, Notes |
| **Quick Actions** | New Task, New Lead, New Note |
| **Tasks** | Search tasks by name, jump to specific task |
| **Settings** | Toggle theme (future), manage organizations |
| **Help** | Keyboard shortcuts, documentation |

**Keyboard shortcuts (global):**
| Shortcut | Action |
|----------|--------|
| `⌘K` | Open command palette |
| `⌘N` | New task |
| `⌘/` | Show keyboard shortcuts |
| `G then T` | Go to Tasks |
| `G then C` | Go to Calendar |
| `G then L` | Go to Leads |

**Estimated addition:** +4-6 hours to implementation

---

## Open Questions

1. **Animation:** Add `tailwindcss-animate` or use `framer-motion`?

---

## Appendix: shadcn/ui Init Config

```json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

## References

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
