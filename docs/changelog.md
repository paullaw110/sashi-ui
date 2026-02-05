# Changelog

All notable changes to sashi-ui are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

### Added
- **Calendar Events Feature** - Full events system separate from tasks
  - Events API with CRUD operations
  - Drag-to-create events on week calendar
  - Recurring events with RRULE (RFC 5545) support
  - Event exceptions for editing single occurrences
  - Edit modes: single occurrence, this-and-future, all events
  - EventDetailModal with autosave
  - RecurrenceEditor component for RRULE configuration
- Documentation system with architecture, project status, and feature references

### Changed
- Default event color changed to brand lime (#EFFF83)
- Moved root CHANGELOG.md to docs/changelog.md

### Fixed
- Event update optimistic updates (avoid query invalidation that caused flicker)
- Event move jumping back to original position (PATCH handler was parsing dates without UTC, causing timezone issues)
- TypeScript circular reference in schema.ts (moved taskTags after tasks table)
- Type inference issues in server components with serialized task data

---

## [0.1.1] - 2026-02-05

### Added
- **Mission Control Phase 1** - Multi-agent database schema and API
  - Agents table (Sashi, Kira, Mu)
  - Task comments with @mention support
  - Activity feed for real-time logging
  - Notifications system
  - Task subscriptions
  - Seed endpoint for initializing agents
- **Task search/filter bar** - Cmd+F keyboard shortcut, multi-filter support
- **Side-by-side calendar layout** - Overlapping tasks/events display properly
- **Notion-style time indicator** - Current time shown in calendar

### Fixed
- Event drag-and-drop duration preservation
- Calendar cache management during drag operations
- Calendar drag-drop snapping behavior
- Drop zone highlight synchronization
- Flash elimination during calendar interactions
- Query invalidation causing UI flicker

### Changed
- Library skills tab reorganized with CAST spells and categories

---

## [0.1.0] - 2026-02-01

### Added
- **Bulk select & actions** (PRD-bulk-select Phases 1-4)
  - Shift+click range selection
  - Cmd+click individual selection
  - Batch status, priority, date updates
  - Keyboard shortcuts (Escape to deselect)
- **Reports API and UI** - Morning/nightly summary reports in Library
- **CAST spells** - Skills library with copy-on-hover
- **SkillsManager** - Skill detail modal with hover copy

### Fixed
- Task list scrolling on Tasks view
- Dashboard task list column scrolling
- Spurious "0" appearing after task names
- Mac app API calls now use Vercel URL

---

## [0.0.9] - 2026-01-31

### Added
- **Mac App Phase 4** - Custom app icon, DMG configuration, auto-updater
- **Mobile Phase 3** - Pull-to-refresh and polish
- **UpdateChecker component** - For Tauri auto-updates
- Plus button on calendar day hover for quick event creation

### Fixed
- Mac app API routing to use production URL

---

## [0.0.8] - 2026-01-31

### Added
- **Mac App Phase 3** - Offline SQLite sync engine
  - Background periodic sync (every 5 minutes)
  - Offline database support via Tauri SQL plugin
- **Mobile Phase 1 & 2** - Mobile task views with swipe gestures
  - Swipe right to complete
  - Swipe left to reschedule
  - Bottom sheet task detail
- **AI PRD Workflow Phase 3** - Improved PRD display with expandable preview

### Changed
- Subtasks filtered from main task list (shown under parent)
- Subtask count indicators in TaskTable

---

## [0.0.7] - 2026-01-31

### Added
- **Mac App Phase 2** - Native menus, tray icon, global shortcuts
- **AI PRD Workflow Phase 2** - Subtask display in TaskDetailModal
- **Tags system** - TagInput in TaskDetailModal, Tags column in TaskTable
- **Library page** - Replaces Skills, shows PRDs and reports
- **Organization tab page** - Dedicated org management
- **Emoji icons** - For organizations and projects
- Organizations section in sidebar with collapsible list

### Changed
- PRD-tags and PRD-library marked complete
- PRD-organization-tab and PRD-icons marked complete

---

## [0.0.6] - 2026-01-30

### Added
- **Mac App Phase 1** - Tauri scaffolding and initial setup
- **AI PRD Workflow Phase 1** - Schema, APIs, PRDCreator component
- **CAST Skills Library** - Full implementation with hover copy and detail modal

### Fixed
- Task modal header layout and dropdown styling
- Empty priority/status fields now clickable
- Calendar drag-drop snapping

---

## [0.0.5] - 2026-01-30

### Added
- **Time-based week calendar** - Google Calendar-style hour slots
- Volt/lime accent for working state indicator
- Full-height week view
- Instant visual feedback on calendar interactions

### Changed
- Dashboard migrated to React Query with optimistic updates
- Done tasks shown grayed out instead of hidden

### Fixed
- Resize uses proper pointer capture
- Redundant time preview removed from hour slots
- Inline task disappearing on creation
- TimeWeekCalendar all-day section and text truncation

---

## [0.0.4] - 2026-01-29

### Added
- **Volt status indicator** - Working state uses lime accent (#EFFF83)
- **Auto-save TaskDetailModal** - All changes save immediately
- **Delete in overflow menu** - Three-dot menu next to close button
- **Inline task creation** - "+ New task" row in tables
- **Inline status/priority editing** - Click badges to change
- **Inline org/project editing** - Searchable dropdown with create option
- **Today highlight in date picker** - Current date in lime accent
- **Full-height calendar** - Fills viewport

### Fixed
- Task creation date parsing - ISO string handling
- Status badge wrapping to two lines
- Inline selection using name instead of ID
- Duplicate database entries cleaned up

### Changed
- Minimal week calendar cards - Only non-negotiable gets colored border
- Status badges simplified - Plain muted text

---

## [0.0.3] - 2026-01-29

### Added
- **Sashi Design System** - Dark palette, lime accent
- **Cmd+Z undo support** - Global undo stack for task operations
- **Notion-style inline create** - Organization and Project dropdowns

### Fixed
- Task status change bug - React Query cache desync
- Duplicate status dot removed from SelectTrigger

---

## [0.0.2] - 2026-01-28

### Added
- **shadcn/ui migration** - Dialog, Select, Popover, Command, Calendar
- **Form validation** - Zod schemas for task and organization forms
- **Test suite** - 37 unit tests, Playwright E2E setup
- React Query for server state management

### Fixed
- Calendar drag-drop connected to React Query cache
- Modal background transparency

---

## [0.0.1] - 2026-01-27

### Added
- **Foundation**
  - Next.js 16.1 + React 19.2 + Tailwind v4
  - Turso database integration
  - Drizzle ORM setup
- **Core Features**
  - Task CRUD operations
  - Project management
  - Organization hierarchy
  - Week calendar with drag-and-drop
  - Month calendar view
  - Dashboard with Today/Next sections
  - Sidebar navigation
  - Status API for Sashi working state
- **Calendar**
  - Drag-and-drop task scheduling
  - Marquee selection
  - QuickAddTask feature (Cmd+K)
  - Time-based drag and drop

---

*Format: [VERSION] - YYYY-MM-DD*
*Categories: Added, Changed, Fixed, Removed*
