# Organizations & Projects Feature Reference

## Overview

Organizations and Projects provide hierarchical structure for grouping tasks. Organizations are the top level (like workspaces or companies), and Projects belong to organizations. Tasks can be assigned to both an organization and a project for flexible filtering.

## Key Files

| File | Purpose |
|------|---------|
| [src/app/organizations/[id]/page.tsx](../../src/app/organizations/[id]/page.tsx) | Org detail page |
| [src/app/organizations/[id]/OrganizationPageClient.tsx](../../src/app/organizations/[id]/OrganizationPageClient.tsx) | Org client component |
| [src/components/OrganizationManager.tsx](../../src/components/OrganizationManager.tsx) | Org list and management |
| [src/components/OrganizationModal.tsx](../../src/components/OrganizationModal.tsx) | Create/edit org |
| [src/components/Sidebar.tsx](../../src/components/Sidebar.tsx) | Org navigation in sidebar |
| [src/app/api/organizations/route.ts](../../src/app/api/organizations/route.ts) | Org API endpoint |
| [src/app/api/projects/route.ts](../../src/app/api/projects/route.ts) | Project API endpoint |

## Database Schema

```sql
organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,              -- Single emoji character
  created_at INTEGER NOT NULL
)

projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,             -- Hex color like "#FF5733"
  icon TEXT,              -- Single emoji character
  type TEXT,              -- client | personal | work
  organization_id TEXT REFERENCES organizations(id),
  created_at INTEGER NOT NULL
)
```

## API Endpoints

### Organizations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/organizations` | GET | List all organizations |
| `/api/organizations` | POST | Create organization |
| `/api/organizations/:id` | GET | Get single organization |
| `/api/organizations/:id` | PATCH | Update organization |
| `/api/organizations/:id` | DELETE | Delete organization |

### Projects

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List all projects |
| `/api/projects` | POST | Create project |
| `/api/projects/:id` | GET | Get single project |
| `/api/projects/:id` | PATCH | Update project |
| `/api/projects/:id` | DELETE | Delete project |

## Key Features

### Organizations
- **Emoji icons** - Visual identification (clickable to change)
- **Collapsible list** - In sidebar for navigation
- **Organization tab** - Dedicated management page
- **Task filtering** - Filter tasks by organization

### Projects
- **Color coding** - Hex color for visual distinction
- **Project types** - client, personal, or work
- **Emoji icons** - Optional visual identifier
- **Organization assignment** - Projects belong to one org

### Inline Selection
- **Searchable dropdown** - Filter by typing
- **Create inline** - Add new org/project from dropdown
- **Used in** - Task detail modal, quick add

## Hierarchy

```
Organization (e.g., "Acme Corp")
├── Project A (e.g., "Website Redesign")
│   ├── Task 1
│   └── Task 2
└── Project B (e.g., "Mobile App")
    ├── Task 3
    └── Task 4
```

## Sidebar Navigation

The sidebar shows organizations in a collapsible list:

```
📁 Organizations
├── 🏢 Acme Corp
│   ├── Website Redesign
│   └── Mobile App
└── 🏠 Personal
    └── Side Projects
```

## Usage Patterns

### Filtering Tasks

```typescript
// Filter tasks by organization
GET /api/tasks?organizationId=xxx

// Filter tasks by project
GET /api/tasks?projectId=xxx
```

### Creating with Inline Selection

```typescript
// In TaskDetailModal
<OrganizationSelect
  value={organizationId}
  onChange={setOrganizationId}
  allowCreate={true}
/>

<ProjectSelect
  value={projectId}
  onChange={setProjectId}
  organizationId={organizationId}
  allowCreate={true}
/>
```

## Related Components

- `InlineOrgProjectSelect.tsx` - Inline dropdown selection
- `TaskDetailModal.tsx` - Uses org/project selects
- `TaskSearchFilterBar.tsx` - Filter by org/project

## Related PRDs

- [PRD-organization-tab](../PRD-organization-tab.md)
- [PRD-icons](../PRD-icons.md)
- [PRD-inline-org-project](../PRD-inline-org-project.md)
