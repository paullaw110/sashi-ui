# Changelog

All notable changes to sashi-ui are documented here.

---

## [Unreleased]

### Added
- **Volt status indicator** — Working state now uses lime accent (#EFFF83) ⚡
- **Auto-save TaskDetailModal** — All field changes save immediately, no Save/Cancel buttons
- **Delete in overflow menu** — Three-dot menu next to X close button
- **Inline task creation** — "+ New task" row in Today/Next tables on Dashboard
- **Inline status/priority editing** — Click badges in task table to change via dropdown
- **Inline org/project editing** — Click to open searchable dropdown with create option
- **Today highlight in date picker** — Current date shown in lime accent
- **Full-height calendar** — Calendar page fills viewport instead of fixed 600px

### Fixed
- **Task creation date parsing** — Modal was sending ISO strings, API was mangling them
- **Status badge wrapping** — "Not Started" no longer wraps to two lines
- **Inline selection not working** — CommandItem using name instead of ID caused issues
- **Duplicate database entries** — Cleaned up 119 duplicate tasks, 1 duplicate org

### Changed
- **Minimal week calendar cards** — Only non-negotiable priority gets colored border
- **Status badges simplified** — Plain muted text instead of colored backgrounds

---

## [2026-01-29]

### Added
- **Sashi Design System** — GT Sectra Display font, dark palette, lime accent
- **Cmd+Z undo support** — Global undo stack for task operations
- **Notion-style inline create** — Organization and Project dropdowns in modals

### Fixed
- **Task status change bug** — React Query cache desync with raw fetch calls
- **Duplicate status dot** — Removed redundant dot from SelectTrigger

---

## [2026-01-28]

### Added
- **shadcn/ui migration** — Dialog, Select, Popover, Command, Calendar components
- **Form validation** — Zod schemas for task and organization forms
- **Test suite** — 37 unit tests, Playwright E2E setup

### Fixed
- **Calendar drag-drop** — Connected React Query cache to UI for optimistic updates
- **Modal background transparency** — Fixed dialog overlay styling

---

## [Earlier]

### Foundation
- Next.js 16.1 + React 19.2 + Tailwind v4
- Turso database integration
- Task, Project, Organization CRUD
- Week calendar with drag-and-drop
- Month calendar view
- Dashboard with Today/Next sections
- Sidebar navigation
- Status API for Sashi working state

---

*Format: [YYYY-MM-DD] or [Unreleased] for pending deployment*
