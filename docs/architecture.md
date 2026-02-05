# Sashi UI Architecture

## Overview

Sashi UI is a multi-platform task management application with AI capabilities. It combines a Next.js web app with a Tauri desktop app, supporting offline-first workflows and multi-agent AI collaboration through the Mission Control system.

The application serves as a personal productivity hub, integrating tasks, calendar events, notes, and AI-powered PRD generation into a cohesive experience.

---

## Tech Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.4 | React framework with App Router |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |

### Database & ORM
| Technology | Version | Purpose |
|------------|---------|---------|
| Turso | - | Cloud-hosted SQLite (libSQL) |
| Drizzle ORM | 0.45.1 | Type-safe database operations |
| @libsql/client | 0.17.0 | Turso database client |
| better-sqlite3 | 12.6.2 | Local SQLite for Tauri |

### UI Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| shadcn/ui | - | Radix primitives + Tailwind |
| Tailwind CSS | 4.x | Utility-first styling |
| Radix UI | Various | Accessible UI primitives |
| Lucide React | 0.563.0 | Icon library |

### State Management
| Technology | Version | Purpose |
|------------|---------|---------|
| TanStack Query | 5.90.20 | Server state, optimistic updates |
| React Context | - | App-level providers (Undo, Offline) |

### Desktop App
| Technology | Version | Purpose |
|------------|---------|---------|
| Tauri | 2.x | Native Mac/Windows app |
| @tauri-apps/api | 2.9.1 | JavaScript APIs |
| @tauri-apps/plugin-sql | 2.3.1 | Offline SQLite |
| @tauri-apps/plugin-updater | 2.9.0 | Auto-updates |

### AI Integration
| Technology | Version | Purpose |
|------------|---------|---------|
| @anthropic-ai/sdk | 0.72.1 | Claude API for PRD generation |
| agentation | 1.3.2 | AI agent orchestration |

### Other Key Libraries
| Technology | Purpose |
|------------|---------|
| @dnd-kit | Drag-and-drop |
| @tiptap | Rich text editing |
| date-fns | Date manipulation |
| rrule | Recurring events (RFC 5545) |
| react-hook-form + zod | Form validation |
| vaul | Mobile drawer/sheet |
| sonner | Toast notifications |
| cmdk | Command palette |

---

## Project Structure

```
sashi-ui/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Dashboard (home)
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── globals.css           # Global styles
│   │   ├── api/                  # API routes (35 endpoints)
│   │   │   ├── tasks/            # Task CRUD + bulk operations
│   │   │   ├── events/           # Calendar events
│   │   │   ├── organizations/    # Organization management
│   │   │   ├── projects/         # Project management
│   │   │   ├── tags/             # Tag management
│   │   │   ├── agents/           # Mission Control agents
│   │   │   ├── activity/         # Activity feed
│   │   │   ├── notifications/    # Agent notifications
│   │   │   ├── inbox/            # Quick capture
│   │   │   ├── notes/            # Notes CRUD
│   │   │   ├── leads/            # SuperLandings integration
│   │   │   ├── reports/          # Morning/nightly summaries
│   │   │   ├── queue/            # Sashi work queue
│   │   │   └── status/           # Working state
│   │   ├── tasks/                # Tasks page
│   │   ├── calendar/             # Calendar page
│   │   ├── inbox/                # Inbox page
│   │   ├── notes/                # Notes page
│   │   ├── library/              # Library/skills page
│   │   ├── leads/                # Leads page
│   │   ├── queue/                # Queue page
│   │   ├── skills/               # Skills manager
│   │   ├── playground/           # Code playground
│   │   └── organizations/        # Organization pages
│   │
│   ├── components/               # React components (~78)
│   │   ├── ui/                   # shadcn/ui primitives
│   │   ├── AppLayout.tsx         # Main app shell
│   │   ├── Dashboard.tsx         # Dashboard component
│   │   ├── TaskTable.tsx         # Task list table
│   │   ├── TaskDetailModal.tsx   # Task editing modal
│   │   ├── CalendarView.tsx      # Calendar component
│   │   ├── EventDetailModal.tsx  # Event editing modal
│   │   ├── Mobile*.tsx           # Mobile-specific components
│   │   └── ...
│   │
│   └── lib/                      # Utilities and helpers
│       ├── db/
│       │   ├── schema.ts         # Drizzle ORM schema (17 tables)
│       │   └── index.ts          # Database client
│       ├── hooks/                # Custom React hooks
│       │   ├── use-tasks.ts      # Task operations
│       │   ├── use-events.ts     # Event operations
│       │   ├── use-undo.ts       # Undo/redo
│       │   ├── use-media-query.ts
│       │   └── use-pull-to-refresh.ts
│       ├── offline/              # Tauri offline support
│       ├── validations/          # Zod schemas
│       ├── query-provider.tsx    # TanStack Query setup
│       ├── api.ts                # API client utilities
│       └── utils.ts              # Shared utilities
│
├── src-tauri/                    # Tauri desktop app
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   └── lib.rs                # Rust library
│   ├── tauri.conf.json           # Tauri configuration
│   └── icons/                    # App icons
│
├── docs/                         # Documentation & PRDs
├── e2e/                          # Playwright E2E tests
├── db/                           # Local database files
├── memory/                       # AI agent memory
├── brain/                        # AI agent brain
└── global-skills/                # Reusable AI skills
```

---

## Database Schema

### Core Entities

```
organizations
├── id (PK)
├── name
├── description
├── icon (emoji)
└── createdAt

projects
├── id (PK)
├── name
├── color (hex)
├── icon (emoji)
├── type (client|personal|work)
├── organizationId (FK → organizations)
└── createdAt

tasks
├── id (PK)
├── name
├── projectId (FK → projects)
├── organizationId (FK → organizations)
├── priority (non-negotiable|critical|high|medium|low)
├── status (not_started|in_progress|waiting|done)
├── dueDate, dueTime, duration
├── tags (JSON), description (HTML)
├── prd, prdContext, prdChat (PRD fields)
├── parentId (FK → tasks, for subtasks)
└── createdAt, updatedAt

tags
├── id (PK)
├── name (unique)
├── color (hex)
└── createdAt

taskTags (junction)
├── taskId (FK → tasks)
├── tagId (FK → tags)
└── createdAt
```

### Calendar

```
events
├── id (PK)
├── name, description, location
├── startDate, startTime, endTime, isAllDay
├── color
├── recurrenceRule (RRULE), recurrenceEnd
└── createdAt, updatedAt

eventExceptions
├── id (PK)
├── eventId (FK → events)
├── originalDate
├── isCancelled
├── modifiedName, modifiedStartTime, modifiedEndTime, modifiedLocation
└── createdAt
```

### Mission Control (Multi-Agent)

```
agents
├── id (PK: sashi|kira|mu)
├── name, role, description, avatar
├── status (idle|active|blocked)
├── sessionKey, model
├── currentTaskId (FK → tasks)
└── lastActiveAt, createdAt

taskComments
├── id (PK)
├── taskId (FK → tasks)
├── agentId (FK → agents)
├── content, attachments (JSON)
└── createdAt

activityFeed
├── id (PK)
├── type, agentId, taskId
├── message, metadata (JSON)
└── createdAt

notifications
├── id (PK)
├── mentionedAgentId, fromAgentId (FK → agents)
├── taskId, commentId
├── content, delivered, read
└── createdAt

taskSubscriptions
├── taskId (FK → tasks)
├── agentId (FK → agents)
└── createdAt
```

### Supporting Tables

```
notes           - Rich text notes (title, content HTML)
inboxItems      - Quick capture (content, type, url, metadata)
sashiQueue      - Work queue (task, status, sessionKey)
sashiStatus     - Singleton status (state, task, startedAt)
leads           - SuperLandings prospects (40+ fields)
reports         - Morning/nightly summaries
```

---

## API Architecture

### REST Endpoints

| Resource | Methods | Description |
|----------|---------|-------------|
| `/api/tasks` | GET, POST | List/create tasks |
| `/api/tasks/[id]` | GET, PATCH, DELETE | Task CRUD |
| `/api/tasks/[id]/subtasks` | GET, POST | Subtask management |
| `/api/tasks/[id]/tags` | POST, DELETE | Task-tag associations |
| `/api/tasks/[id]/comments` | GET, POST | Task comments |
| `/api/tasks/[id]/generate-prd` | POST | AI PRD generation |
| `/api/tasks/[id]/finalize-prd` | POST | PRD finalization |
| `/api/tasks/bulk` | POST | Batch operations |
| `/api/events` | GET, POST | List/create events |
| `/api/events/[id]` | GET, PATCH, DELETE | Event CRUD |
| `/api/organizations` | GET, POST | List/create orgs |
| `/api/organizations/[id]` | GET, PATCH, DELETE | Org CRUD |
| `/api/projects` | GET, POST | List/create projects |
| `/api/projects/[id]` | GET, PATCH, DELETE | Project CRUD |
| `/api/tags` | GET, POST | List/create tags |
| `/api/tags/[id]` | PATCH, DELETE | Tag CRUD |
| `/api/agents` | GET | List agents |
| `/api/agents/[id]` | PATCH | Update agent status |
| `/api/agents/seed` | POST | Initialize agents |
| `/api/activity` | GET, POST | Activity feed |
| `/api/notifications` | GET, PATCH | Notifications |
| `/api/inbox` | GET, POST | Inbox items |
| `/api/inbox/[id]` | DELETE | Remove inbox item |
| `/api/notes` | GET, POST | Notes |
| `/api/notes/[id]` | GET, PATCH, DELETE | Note CRUD |
| `/api/leads` | GET, POST | Leads |
| `/api/leads/[id]` | PATCH, DELETE | Lead CRUD |
| `/api/leads/scrape` | POST | Web scraping |
| `/api/reports` | GET, POST | Reports |
| `/api/queue` | GET, POST | Sashi queue |
| `/api/status` | GET, PATCH | Working status |

---

## Component Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│   Pages (page.tsx) → Layouts → Feature Components          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                      │
│   Custom Hooks (use-tasks, use-events)                     │
│   TanStack Query (caching, optimistic updates)             │
│   Providers (OfflineProvider, UndoProvider)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                       API LAYER                             │
│   Next.js Route Handlers (src/app/api/*)                   │
│   REST endpoints with JSON responses                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    DATABASE LAYER                           │
│   Drizzle ORM → Turso (cloud) or SQLite (Tauri)           │
└─────────────────────────────────────────────────────────────┘
```

### Component Layers

**Layout Components**
- `layout.tsx` - Root layout with QueryProvider, OfflineProvider, Toaster
- `AppLayout.tsx` - App shell with sidebar navigation

**Feature Components**
- `Dashboard.tsx` - Home page with today/tomorrow/week views
- `TasksView.tsx` - Full task list with filters
- `CalendarView.tsx` - Week/month calendar
- `NotesView.tsx` - Notes management
- `LibraryPageClient.tsx` - PRD/skills browser

**Shared Components**
- `TaskDetailModal.tsx` - Task editing (autosave)
- `EventDetailModal.tsx` - Event editing
- `TaskTable.tsx` - Sortable task table
- `BulkActionsBar.tsx` - Multi-select operations
- `TaskSearchFilterBar.tsx` - Search and filters

**Mobile Components**
- `MobileTaskList.tsx` - Touch-optimized list
- `MobileTaskRow.tsx` - Swipeable row
- `MobileTaskDetail.tsx` - Bottom sheet detail
- `MobileDayCalendar.tsx` - Single-day view

**UI Primitives** (shadcn/ui)
- Button, Dialog, Select, Popover, Command, Calendar
- Checkbox, Switch, Progress, Tabs, Tooltip
- AlertDialog, DropdownMenu, Separator

---

## Platform Support

### Web (Primary)
- Deployed on Vercel
- Full feature support
- Server-side rendering for initial load

### Mac Desktop (Tauri)
- Native window chrome
- Menu bar icon with dropdown
- Global shortcuts (Cmd+K, Cmd+Shift+S)
- Offline SQLite database
- Background sync (5-minute intervals)
- Auto-updater

### Mobile (Responsive)
- Breakpoint: < 640px triggers mobile UI
- Swipe gestures (right = complete, left = reschedule)
- Bottom sheet modals (Vaul)
- Pull-to-refresh
- Single-day calendar view
- Touch targets: 44x44px minimum

---

## Design System

### Sashi Design System

**Typography**
- Headings: Geist Sans
- Body: Geist Sans
- Monospace: Geist Mono

**Colors**
- Background: Dark (#0a0a0a, #1a1a1a)
- Accent: Lime (#EFFF83)
- Text: Light gray (#e5e5e5)
- Borders: Dark gray (#333)

**Key Patterns**
- Autosave modals (no Save/Cancel buttons)
- Inline editing in tables
- Optimistic updates via React Query
- Cmd+Z undo support
- "Volt" status indicator for working state

---

## Development

### Commands

```bash
# Development
npm run dev           # Start Next.js dev server
npm run tauri:dev     # Start Tauri dev mode

# Build
npm run build         # Production build
npm run build:static  # Static build for Tauri
npm run tauri:build   # Build Tauri app

# Testing
npm run test          # Vitest unit tests
npm run test:ui       # Vitest with UI
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E tests

# Other
npm run lint          # ESLint
```

### Environment Variables

```env
TURSO_DATABASE_URL=   # Turso database URL
TURSO_AUTH_TOKEN=     # Turso auth token
NEXT_PUBLIC_API_URL=  # API URL (for Tauri static builds)
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Database schema (17 tables) |
| `src/lib/db/index.ts` | Database client initialization |
| `src/app/layout.tsx` | Root layout with providers |
| `src/lib/query-provider.tsx` | TanStack Query configuration |
| `src/lib/hooks/use-tasks.ts` | Task CRUD hooks |
| `src/lib/hooks/use-events.ts` | Event CRUD hooks |
| `src/components/AppLayout.tsx` | App shell component |
| `package.json` | Dependencies and scripts |
| `src-tauri/tauri.conf.json` | Tauri configuration |
