# CLAUDE.md - Sashi UI Project Guide

This file provides context for Claude Code when working on the sashi-ui project.

## Project Overview

Sashi UI is a multi-platform task management application with AI capabilities. It combines:
- **Web app** - Next.js 16 with React 19
- **Desktop app** - Tauri for macOS with offline support
- **Mobile** - Responsive design with touch gestures

The app features task management, calendar events, multi-agent collaboration (Mission Control), and AI-powered PRD generation.

## Quick Start

```bash
# Development
npm run dev           # Start Next.js dev server
npm run tauri:dev     # Start Tauri desktop app

# Build
npm run build         # Production build
npm run tauri:build   # Build desktop app

# Testing
npm run test          # Vitest unit tests
npm run test:e2e      # Playwright E2E tests
```

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js pages and API routes |
| `src/components/` | React components (~78) |
| `src/lib/db/` | Drizzle ORM schema and client |
| `src/lib/hooks/` | Custom React hooks |
| `src-tauri/` | Tauri desktop app |
| `docs/` | PRDs and documentation |

## Tech Stack

- **Framework**: Next.js 16.1, React 19.2, TypeScript
- **Database**: Turso (cloud SQLite), Drizzle ORM
- **UI**: shadcn/ui, Tailwind CSS v4
- **State**: TanStack Query
- **Desktop**: Tauri 2.x

## Development Patterns

### Task Updates
Use optimistic updates via React Query:
```typescript
const mutation = useMutation({
  mutationFn: updateTask,
  onMutate: async (newTask) => {
    await queryClient.cancelQueries(['tasks']);
    const previous = queryClient.getQueryData(['tasks']);
    queryClient.setQueryData(['tasks'], /* optimistic update */);
    return { previous };
  },
  onError: (err, newTask, context) => {
    queryClient.setQueryData(['tasks'], context.previous);
  },
});
```

### Modals
Use autosave pattern (no Save/Cancel buttons):
```typescript
const debouncedSave = useDebouncedCallback((value) => {
  mutation.mutate({ id: task.id, ...value });
}, 500);
```

### Mobile Detection
```typescript
const isMobile = useMediaQuery('(max-width: 639px)');
```

## Database Schema

Key tables in `src/lib/db/schema.ts`:
- `organizations`, `projects`, `tasks` - Core entities
- `events`, `eventExceptions` - Calendar
- `agents`, `taskComments`, `activityFeed`, `notifications` - Mission Control
- `tags`, `taskTags` - Tagging system

## Documentation

See `docs/` for:
- `architecture.md` - System design and tech stack
- `project-status.md` - Milestones and progress
- `changelog.md` - Change history
- `references/` - Feature documentation
- `PRD-*.md` - Product requirement documents

---

## Documentation Maintenance

After completing any feature, bug fix, or significant change:
- Update `docs/changelog.md` with the change
- Update `docs/project-status.md` with current progress and where we left off
- Update `docs/architecture.md` if the system design changed
- Create or update relevant feature reference docs in `docs/references/`

### When to Update Documentation

| Change Type | Files to Update |
|-------------|-----------------|
| New feature | `docs/changelog.md`, relevant `docs/references/*.md` |
| Bug fix | `docs/changelog.md` |
| PRD completion | `docs/project-status.md`, `docs/changelog.md` |
| Architecture change | `docs/architecture.md` |
| Session end | `docs/project-status.md` ("Where We Left Off") |

### Changelog Format

Use [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [VERSION] - YYYY-MM-DD

### Added
- **Feature name** - Brief description

### Changed
- Description of change

### Fixed
- Bug that was fixed

### Removed
- Feature that was removed
```

### Project Status Updates

After each session, update the "Where We Left Off" section in `docs/project-status.md`:

```markdown
### Last Session (YYYY-MM-DD)

**Completed:**
- What was accomplished

**Next Steps:**
- What should be tackled next

**Blockers:**
- Any issues encountered
```

### Using /update-docs

Run the `/update-docs` command to automatically update documentation based on recent changes. This will:
1. Analyze recent git commits
2. Add entries to `docs/changelog.md`
3. Update `docs/project-status.md`
4. Prompt for session notes
