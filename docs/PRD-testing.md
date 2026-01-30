# PRD: sashi-ui Test Suite

**Status:** Draft  
**Author:** Sashi  
**Created:** 2026-01-29  
**Last Updated:** 2026-01-29

---

## Executive Summary

Implement a comprehensive test suite for sashi-ui covering unit tests, API integration tests, component tests, and end-to-end tests. The goal is to ensure reliability, catch regressions early, and enable confident refactoring (especially important during the shadcn migration).

---

## Current State

- **Framework:** Next.js 16.1 (App Router)
- **Database:** Turso (SQLite) via Drizzle ORM
- **Tests:** None currently
- **CI/CD:** None configured

### Data Models
| Model | Fields | Relationships |
|-------|--------|---------------|
| Organizations | id, name, description | → Projects, Tasks |
| Projects | id, name, color, type, organizationId | → Organization, Tasks |
| Tasks | id, name, projectId, organizationId, priority, status, dueDate, dueTime, duration, tags, description | → Project, Organization |
| Notes | id, title, content | — |
| InboxItems | id, content, type, url, metadata | — |
| Leads | id, businessName, industry, location, ... (20+ fields) | — |
| SashiQueue | id, task, status, sessionKey | — |

### API Routes
| Resource | Endpoints |
|----------|-----------|
| Tasks | GET, POST `/api/tasks` · GET, PATCH, DELETE `/api/tasks/[id]` |
| Organizations | GET, POST `/api/organizations` · GET, PUT, DELETE `/api/organizations/[id]` · POST `/api/organizations/migrate` |
| Notes | GET, POST `/api/notes` · GET, PATCH, DELETE `/api/notes/[id]` |
| Inbox | GET, POST `/api/inbox` · DELETE `/api/inbox/[id]` |
| Leads | GET, POST `/api/leads` · GET, PATCH, DELETE `/api/leads/[id]` · POST `/api/leads/scrape` |
| Queue | GET, POST `/api/queue` · PATCH, DELETE `/api/queue/[id]` |
| Status | GET, POST `/api/status` |

### Pages
| Route | Features |
|-------|----------|
| `/` | Dashboard with stats |
| `/tasks` | Task list, month/week calendar views, drag-and-drop |
| `/calendar` | Full calendar view with scheduling |
| `/leads` | Lead table, side panel editing |
| `/notes` | Note list with rich text editor |
| `/inbox` | Inbox items by type |
| `/queue` | Sashi's work queue |
| `/skills` | Skills management UI |
| `/playground` | Code playground |

---

## Goals

### Primary
1. **Prevent regressions** — Catch breaking changes before deploy
2. **Enable confident refactoring** — Essential for shadcn migration
3. **Document behavior** — Tests serve as living documentation
4. **Fast feedback loop** — Run in <60s for local dev

### Secondary
1. Establish testing patterns for future features
2. Enable CI/CD pipeline
3. Improve code quality through testability

### Non-Goals
- 100% coverage (target: 80% for critical paths)
- Visual regression testing (consider later)
- Performance testing (separate concern)

---

## Testing Strategy

### Test Pyramid

```
        /\
       /E2E\        ~10 tests (critical flows)
      /------\
     /Component\    ~40 tests (UI behavior)
    /------------\
   / Integration  \  ~30 tests (API routes)
  /----------------\
 /      Unit        \ ~20 tests (utilities, hooks)
/--------------------\
```

### Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Unit | Vitest | Fast, ESM-native, great DX |
| Component | React Testing Library | Tests behavior, not implementation |
| Integration | Vitest + test DB | Real Drizzle queries, isolated |
| E2E | Playwright | Cross-browser, reliable, built-in assertions |

---

## Phase 1: Setup & Unit Tests

### 1.1 Install Dependencies

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test msw
```

### 1.2 Configure Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 1.3 Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

### 1.4 Unit Tests

| File | Tests |
|------|-------|
| `src/lib/utils.test.ts` | `cn()`, `formatDate()`, `formatTime()`, `generateId()`, `getPriorityColor()`, `getStatusColor()`, `getStatusLabel()` |
| `src/lib/hooks/use-tasks.test.ts` | Query key generation, mutation optimistic updates |

**Example: `utils.test.ts`**
```typescript
import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatTime, getPriorityColor, getStatusLabel } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })
  
  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })
  
  it('dedupes tailwind conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })
})

describe('formatDate', () => {
  it('formats date as short month + day', () => {
    const date = new Date('2026-01-29')
    expect(formatDate(date)).toBe('Jan 29')
  })
  
  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })
})

describe('formatTime', () => {
  it('converts 24h to 12h format', () => {
    expect(formatTime('14:30')).toBe('2:30 PM')
    expect(formatTime('09:00')).toBe('9:00 AM')
  })
  
  it('handles midnight and noon', () => {
    expect(formatTime('00:00')).toBe('12:00 AM')
    expect(formatTime('12:00')).toBe('12:00 PM')
  })
})

describe('getPriorityColor', () => {
  it('returns correct colors for each priority', () => {
    expect(getPriorityColor('critical')).toContain('red')
    expect(getPriorityColor('high')).toContain('amber')
    expect(getPriorityColor('medium')).toContain('blue')
    expect(getPriorityColor('low')).toContain('gray')
  })
})

describe('getStatusLabel', () => {
  it('returns human-readable labels', () => {
    expect(getStatusLabel('not_started')).toBe('Not Started')
    expect(getStatusLabel('in_progress')).toBe('In Progress')
    expect(getStatusLabel('waiting')).toBe('Waiting On Client')
    expect(getStatusLabel('done')).toBe('Done')
  })
})
```

---

## Phase 2: API Integration Tests

### 2.1 Test Database Setup

Create isolated test database for each test file:

```typescript
// src/test/db.ts
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '@/lib/db/schema'

export function createTestDb() {
  const client = createClient({ url: ':memory:' })
  const db = drizzle(client, { schema })
  return { client, db }
}

export async function seedTestData(db: ReturnType<typeof createTestDb>['db']) {
  // Insert test organizations
  await db.insert(schema.organizations).values([
    { id: 'org-1', name: 'Acme Corp', createdAt: new Date() },
    { id: 'org-2', name: 'Test Inc', createdAt: new Date() },
  ])
  
  // Insert test projects
  await db.insert(schema.projects).values([
    { id: 'proj-1', name: 'Website Redesign', organizationId: 'org-1', createdAt: new Date() },
  ])
  
  // Insert test tasks
  await db.insert(schema.tasks).values([
    { 
      id: 'task-1', 
      name: 'Design mockups', 
      projectId: 'proj-1',
      organizationId: 'org-1',
      status: 'not_started',
      priority: 'high',
      dueDate: new Date('2026-02-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])
}
```

### 2.2 API Route Tests

| Route | Tests |
|-------|-------|
| `GET /api/tasks` | Returns tasks, filters by view/status/project, includes relations |
| `POST /api/tasks` | Creates task, validates required fields, sets defaults |
| `PATCH /api/tasks/[id]` | Updates fields, handles partial updates, 404 on missing |
| `DELETE /api/tasks/[id]` | Removes task, 404 on missing |
| `GET /api/organizations` | Returns orgs with projects |
| `POST /api/organizations` | Creates org, validates name |
| `PUT /api/organizations/[id]` | Updates org |
| `DELETE /api/organizations/[id]` | Cascades to projects? or blocks? |
| `GET /api/leads` | Returns leads, filters by status/industry |
| `PATCH /api/leads/[id]` | Updates lead fields |
| `GET /api/notes` | Returns notes ordered by updatedAt |
| `POST /api/notes` | Creates note with defaults |

**Example: `tasks.api.test.ts`**
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedTestData } from '@/test/db'
import { GET, POST } from '@/app/api/tasks/route'
import { NextRequest } from 'next/server'

describe('Tasks API', () => {
  let db: ReturnType<typeof createTestDb>['db']
  
  beforeEach(async () => {
    const testDb = createTestDb()
    db = testDb.db
    await seedTestData(db)
  })
  
  describe('GET /api/tasks', () => {
    it('returns all tasks for "all" view', async () => {
      const request = new NextRequest('http://localhost/api/tasks?view=all')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.tasks).toHaveLength(1)
      expect(data.tasks[0].name).toBe('Design mockups')
    })
    
    it('filters by status', async () => {
      const request = new NextRequest('http://localhost/api/tasks?view=all&status=done')
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.tasks).toHaveLength(0)
    })
    
    it('includes project and organization relations', async () => {
      const request = new NextRequest('http://localhost/api/tasks?view=all')
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.tasks[0].project).toBeDefined()
      expect(data.tasks[0].project.name).toBe('Website Redesign')
      expect(data.tasks[0].organization.name).toBe('Acme Corp')
    })
  })
  
  describe('POST /api/tasks', () => {
    it('creates a new task', async () => {
      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New task',
          status: 'not_started',
        }),
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.task.name).toBe('New task')
      expect(data.task.id).toBeDefined()
    })
    
    it('requires task name', async () => {
      const request = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ status: 'not_started' }),
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })
})
```

---

## Phase 3: Component Tests

### 3.1 Test Utilities

```typescript
// src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement } from 'react'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createTestQueryClient()
  
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
  
  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  }
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
```

### 3.2 Component Test Cases

| Component | Tests |
|-----------|-------|
| **TaskModal** | Opens/closes, displays task data, saves changes, validates required fields, deletes task, handles priority/status changes |
| **MonthCalendar** | Renders correct month, navigates months, displays tasks on correct dates, handles task click, drag-drop updates date |
| **WeekCalendar** | Renders week view, time slots, task positioning by time |
| **TaskTable** | Renders tasks, checkbox toggles status, sorting, row click opens modal |
| **OrganizationModal** | Creates org, edits org, validates name |
| **OrganizationManager** | Lists orgs, opens modal, deletes org |
| **LeadsTable** | Renders leads, status badges, row selection |
| **LeadSidePanel** | Displays lead details, edits fields, saves changes |
| **QuickAddTask** | Opens popover, creates task, closes on submit |
| **RichEditor** | Renders content, handles typing, toolbar actions |
| **Sidebar** | Navigation links, active state, collapse behavior |

**Example: `TaskModal.test.tsx`**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, userEvent } from '@/test/utils'
import { TaskModal } from '@/components/TaskModal'

const mockTask = {
  id: 'task-1',
  name: 'Test Task',
  projectId: null,
  organizationId: null,
  priority: 'medium',
  status: 'not_started',
  dueDate: '2026-02-01T12:00:00.000Z',
  dueTime: null,
  tags: null,
  description: 'Test description',
}

const mockProjects = [
  { id: 'proj-1', name: 'Project A', organizationId: 'org-1', color: '#000', type: 'client', createdAt: new Date() },
]

const mockOrganizations = [
  { id: 'org-1', name: 'Acme Corp', description: null, createdAt: new Date() },
]

describe('TaskModal', () => {
  it('displays task name when open', () => {
    renderWithProviders(
      <TaskModal
        task={mockTask}
        projects={mockProjects}
        organizations={mockOrganizations}
        isOpen={true}
        onClose={() => {}}
        onSave={async () => {}}
        onDelete={async () => {}}
      />
    )
    
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
  })
  
  it('calls onSave with updated data', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    
    renderWithProviders(
      <TaskModal
        task={mockTask}
        projects={mockProjects}
        organizations={mockOrganizations}
        isOpen={true}
        onClose={() => {}}
        onSave={onSave}
        onDelete={async () => {}}
      />
    )
    
    const nameInput = screen.getByDisplayValue('Test Task')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Task')
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated Task' })
    )
  })
  
  it('calls onClose when clicking X', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    
    renderWithProviders(
      <TaskModal
        task={mockTask}
        projects={mockProjects}
        organizations={mockOrganizations}
        isOpen={true}
        onClose={onClose}
        onSave={async () => {}}
        onDelete={async () => {}}
      />
    )
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(onClose).toHaveBeenCalled()
  })
  
  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    
    renderWithProviders(
      <TaskModal
        task={mockTask}
        projects={mockProjects}
        organizations={mockOrganizations}
        isOpen={true}
        onClose={() => {}}
        onSave={async () => {}}
        onDelete={onDelete}
      />
    )
    
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(deleteButton)
    
    expect(onDelete).toHaveBeenCalledWith('task-1')
  })
})
```

---

## Phase 4: End-to-End Tests

### 4.1 Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 4.2 E2E Test Cases

| Flow | Steps | Assertions |
|------|-------|------------|
| **Task CRUD** | Navigate to /tasks → Create task → Edit task → Mark complete → Delete | Task appears, updates, disappears |
| **Task Drag & Drop** | Drag task from one date to another | Task moves, persists after refresh |
| **Calendar Navigation** | Switch month/week views, navigate dates | Correct dates shown, tasks visible |
| **Organization CRUD** | Create org → Add to task → Delete org | Org appears in dropdowns, cleanup works |
| **Lead Management** | View leads → Open side panel → Update status | Changes persist |
| **Notes** | Create note → Edit with rich text → Delete | Content saves with formatting |
| **Quick Add** | Press hotkey → Enter task → Submit | Task appears in list |

**Example: `tasks.spec.ts`**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks')
  })
  
  test('can create a new task', async ({ page }) => {
    // Click the add task button
    await page.getByRole('button', { name: /add task/i }).click()
    
    // Fill in task details
    await page.getByLabel(/task name/i).fill('E2E Test Task')
    await page.getByLabel(/priority/i).selectOption('high')
    
    // Save
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify task appears
    await expect(page.getByText('E2E Test Task')).toBeVisible()
  })
  
  test('can drag task to new date', async ({ page }) => {
    // Find a task
    const task = page.locator('[data-testid="task-card"]').first()
    const originalDate = await task.getAttribute('data-date')
    
    // Find target date cell
    const targetCell = page.locator('[data-testid="calendar-cell"]').nth(10)
    
    // Drag and drop
    await task.dragTo(targetCell)
    
    // Verify task moved
    const newDate = await task.getAttribute('data-date')
    expect(newDate).not.toBe(originalDate)
    
    // Refresh and verify persistence
    await page.reload()
    const taskAfterRefresh = page.locator('[data-testid="task-card"]').first()
    expect(await taskAfterRefresh.getAttribute('data-date')).toBe(newDate)
  })
  
  test('can toggle task completion', async ({ page }) => {
    // Find task checkbox
    const checkbox = page.locator('[data-testid="task-checkbox"]').first()
    
    // Toggle
    await checkbox.click()
    
    // Verify status changed
    await expect(checkbox).toBeChecked()
  })
  
  test('calendar navigation works', async ({ page }) => {
    // Get current month
    const monthHeader = page.getByTestId('month-header')
    const initialMonth = await monthHeader.textContent()
    
    // Navigate to next month
    await page.getByRole('button', { name: /next month/i }).click()
    
    // Verify month changed
    const newMonth = await monthHeader.textContent()
    expect(newMonth).not.toBe(initialMonth)
    
    // Navigate back
    await page.getByRole('button', { name: /previous month/i }).click()
    expect(await monthHeader.textContent()).toBe(initialMonth)
  })
})
```

**Example: `leads.spec.ts`**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Leads', () => {
  test('can view and edit a lead', async ({ page }) => {
    await page.goto('/leads')
    
    // Click on a lead row
    await page.locator('tr').first().click()
    
    // Side panel should open
    await expect(page.getByTestId('lead-side-panel')).toBeVisible()
    
    // Update status
    await page.getByLabel(/status/i).selectOption('approved')
    
    // Save
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify status badge updated
    await expect(page.locator('tr').first()).toContainText('Approved')
  })
})
```

---

## Phase 5: CI/CD Integration

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-and-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 5.2 Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Test Data Strategy

### Fixtures

```typescript
// src/test/fixtures/index.ts
export const fixtures = {
  organizations: [
    { id: 'org-1', name: 'Acme Corp', description: 'Test org' },
    { id: 'org-2', name: 'Empty Org', description: null },
  ],
  
  projects: [
    { id: 'proj-1', name: 'Website Redesign', organizationId: 'org-1', color: '#3B82F6', type: 'client' },
    { id: 'proj-2', name: 'Personal Site', organizationId: null, color: '#10B981', type: 'personal' },
  ],
  
  tasks: [
    { id: 'task-1', name: 'Design mockups', projectId: 'proj-1', status: 'not_started', priority: 'high', dueDate: '2026-02-01' },
    { id: 'task-2', name: 'Review PRs', projectId: null, status: 'in_progress', priority: 'medium', dueDate: '2026-01-30' },
    { id: 'task-3', name: 'Done task', projectId: 'proj-1', status: 'done', priority: 'low', dueDate: '2026-01-28' },
  ],
  
  leads: [
    { id: 'lead-1', businessName: 'Bobs Plumbing', industry: 'plumber', location: 'LA, CA', status: 'new', qualificationScore: 75 },
    { id: 'lead-2', businessName: 'Happy Teeth', industry: 'dentist', location: 'SF, CA', status: 'approved', qualificationScore: 90 },
  ],
  
  notes: [
    { id: 'note-1', title: 'Meeting notes', content: '<p>Discussion points...</p>' },
  ],
}
```

### Database Seeding (E2E)

```typescript
// e2e/fixtures/seed.ts
import { db } from '@/lib/db'
import { fixtures } from '@/test/fixtures'

export async function seedE2EDatabase() {
  // Clear existing data
  await db.delete(schema.tasks)
  await db.delete(schema.projects)
  await db.delete(schema.organizations)
  await db.delete(schema.leads)
  await db.delete(schema.notes)
  
  // Insert fixtures
  await db.insert(schema.organizations).values(fixtures.organizations)
  await db.insert(schema.projects).values(fixtures.projects)
  await db.insert(schema.tasks).values(fixtures.tasks)
  await db.insert(schema.leads).values(fixtures.leads)
  await db.insert(schema.notes).values(fixtures.notes)
}
```

---

## Timeline Estimate

| Phase | Effort | Elapsed Time |
|-------|--------|--------------|
| Setup (Vitest, Playwright, configs) | 3h | Day 1 |
| Unit Tests (~20) | 4h | Day 1-2 |
| API Integration Tests (~30) | 8h | Day 2-3 |
| Component Tests (~40) | 12h | Day 3-5 |
| E2E Tests (~10) | 8h | Day 5-6 |
| CI/CD Setup | 2h | Day 6 |
| Polish & Documentation | 3h | Day 6 |
| **Total** | **~40h** | **~6 days** |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Unit test coverage | ≥80% for `src/lib/` |
| Component test coverage | ≥70% for critical components |
| E2E pass rate | 100% on CI |
| Test execution time (unit + integration) | <60s |
| E2E execution time | <5min |
| Flaky test rate | <2% |

---

## Maintenance Guidelines

### When to Add Tests
- Every new feature gets unit + component tests
- Bug fixes get regression tests first
- E2E for new user-facing flows

### Test Naming Convention
```
describe('[Component/Module Name]')
  it('[action] [expected result] [condition]')
  
// Examples:
it('displays error message when name is empty')
it('calls onSave with updated data when save clicked')
it('navigates to next month when arrow clicked')
```

### Avoid
- Testing implementation details (use behavior tests)
- Snapshot tests for dynamic content
- Sleep/delays in tests (use waitFor)
- Shared mutable state between tests

---

## Open Questions

1. **Test database:** Use in-memory SQLite or separate Turso test DB?
2. **Mocking:** Mock external APIs (Turso) or use real calls against test DB?
3. **Visual regression:** Add Percy/Chromatic for visual diff testing?
4. **Accessibility tests:** Add axe-core automated accessibility checks?

---

## References

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
