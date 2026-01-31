# PRD: Organization Tab

**Status:** ✅ Complete (2026-01-31)

## Overview
A dedicated page for each organization that shows all its projects and tasks, allows editing org details, and provides a home base for creating new projects and tasks within that org.

## Problem
- Organizations are just labels—no dedicated view
- Can't see all projects/tasks for an org at a glance
- No place to manage org settings or details
- Creating tasks for a specific org requires manually selecting it each time

## Solution
An organization detail page (`/organizations/[id]`) that serves as a hub for everything related to that org.

---

## User Flow

### 1. Entry Points
- Click org name in sidebar (if orgs are listed there)
- Click org name in task table
- Click org in Organization Manager (`/settings` or dedicated page)
- Direct URL: `/organizations/[id]`

### 2. Organization Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back                                                         │
│                                                                 │
│  🏢 imPAC Labs                                          [Edit]  │
│  Created Jan 15, 2026 · 3 projects · 24 tasks                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Projects]  [Tasks]  [Settings]                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Projects                                        [+ New Project]│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📁 Policy Catalogue                              12 tasks   ││
│  │ 📁 Dashboard Redesign                             8 tasks   ││
│  │ 📁 Onboarding Flow                                4 tasks   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Tasks                                              [+ New Task]│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ○ Update the policy catalogue    Policy...  High  Not Start ││
│  │ ○ Fix dashboard loading          Dashboard  Med   In Prog   ││
│  │ ○ Review onboarding copy         Onboard... Low   Not Start ││
│  │ ...                                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Tabs/Sections

#### Projects Tab (default)
- Grid or list of all projects in this org
- Each project card shows:
  - Project name
  - Task count (total / completed)
  - Progress indicator (optional)
- Click project → goes to project detail page (or filters tasks)
- "+ New Project" button creates project pre-filled with this org

#### Tasks Tab
- Full task table filtered to this org
- Same columns as main Tasks page
- Can filter by project within org
- "+ New Task" creates task pre-filled with this org
- Supports all existing task interactions (inline edit, modal, etc.)

#### Settings Tab
- Edit org name
- Add description/notes
- Set org color/icon (future: emoji picker from PRD-icons.md)
- Danger zone: Delete org (with confirmation)

---

## Data Requirements

### Existing Schema (sufficient)
```sql
-- Already have:
organizations (id, name, createdAt)
projects (id, name, organizationId, createdAt)
tasks (id, name, organizationId, projectId, ...)
```

### Optional Additions
```sql
-- For settings/details
ALTER TABLE organizations ADD COLUMN description TEXT;
ALTER TABLE organizations ADD COLUMN color TEXT;
ALTER TABLE organizations ADD COLUMN icon TEXT;
```

---

## API Endpoints

### Existing (reuse)
- `GET /api/organizations` — list all orgs
- `GET /api/organizations/[id]` — get single org
- `PATCH /api/organizations/[id]` — update org
- `DELETE /api/organizations/[id]` — delete org
- `GET /api/projects?organizationId=[id]` — projects for org
- `GET /api/tasks?organizationId=[id]` — tasks for org

### New/Modified
- `GET /api/organizations/[id]/stats` — task counts, project counts
  ```json
  {
    "projectCount": 3,
    "taskCount": 24,
    "completedTaskCount": 12,
    "tasksByStatus": { "not_started": 8, "in_progress": 4, "done": 12 }
  }
  ```

---

## UI Components

### OrganizationPage
```tsx
// /app/organizations/[id]/page.tsx
export default async function OrganizationPage({ params }) {
  const org = await getOrganization(params.id);
  const projects = await getProjects({ organizationId: params.id });
  const stats = await getOrgStats(params.id);
  
  return (
    <AppLayout>
      <OrgHeader org={org} stats={stats} />
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="projects">
          <ProjectGrid projects={projects} orgId={org.id} />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksViewClient 
            initialOrganizationId={org.id}
            hideOrgColumn
          />
        </TabsContent>
        <TabsContent value="settings">
          <OrgSettings org={org} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
```

### OrgHeader
- Org name (editable inline or via modal)
- Stats: project count, task count, completion rate
- Edit button → opens settings or inline edit mode

### ProjectGrid
- Cards for each project
- Click → navigate to project page or filter tasks
- "+ New Project" card/button

### OrgSettings
- Form for name, description, color, icon
- Delete button with confirmation dialog

---

## Navigation Integration

### Sidebar Addition
Add organizations section to sidebar:
```
Dashboard
Tasks
Calendar
───────────
Organizations    ← New section
  imPAC Labs
  House
  Personal
───────────
Settings
```

Or keep it simpler—just make org names clickable wherever they appear.

### Breadcrumbs
When on org page:
```
Organizations / imPAC Labs
```

When on project within org:
```
Organizations / imPAC Labs / Policy Catalogue
```

---

## Phases

### Phase 1: Basic Org Page (~2-3 days)
- Create `/organizations/[id]` route
- Org header with name and stats
- Projects list (simple, clickable)
- Tasks table filtered by org
- "+ New Task" pre-fills org

### Phase 2: Project Management (~1-2 days)
- Project cards with task counts
- "+ New Project" with org pre-filled
- Click project → filters task list

### Phase 3: Settings & Polish (~1-2 days)
- Settings tab with edit form
- Delete org functionality
- Sidebar navigation to orgs
- Org description/notes field

### Phase 4: Future Enhancements
- Org icons/colors (ties into PRD-icons.md)
- Project detail pages
- Org-level analytics/charts
- Team members (if multi-user)

---

## Open Questions

1. **Sidebar space** — Add orgs to sidebar, or rely on other entry points?
2. **Project pages** — Should projects also get dedicated pages, or just filter tasks?
3. **Default tab** — Projects or Tasks when landing on org page?
4. **URL structure** — `/organizations/[id]` or `/org/[slug]`?

---

## Success Metrics

- Time to find all tasks for an org (should be 1 click)
- Usage of org page vs main task list
- Projects created from org page vs elsewhere

---

## Estimate

| Phase | Effort |
|-------|--------|
| Phase 1: Basic Org Page | 2-3 days |
| Phase 2: Project Management | 1-2 days |
| Phase 3: Settings & Polish | 1-2 days |
| **Total** | **4-7 days** |

MVP (Phase 1) in ~2-3 days—just the page with projects list and filtered tasks.
