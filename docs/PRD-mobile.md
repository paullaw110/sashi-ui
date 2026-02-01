# PRD: Mobile Optimization

**Status:** ✅ Complete (2026-01-31)

## Overview

Optimize Sashi UI for mobile devices (phones and small tablets). While the app has basic responsive breakpoints, several views need dedicated mobile treatments to be truly usable on touch devices.

---

## Current State Assessment

### What Works ✅
- Header collapses to hamburger menu on mobile (<768px)
- Dashboard task lists render cleanly
- Cards stack vertically
- Basic touch targets are adequate
- Dialogs/modals scale down

### What Needs Work ⚠️

| Issue | Page | Severity |
|-------|------|----------|
| Calendar cramped, tasks truncated | /tasks (calendar view) | High |
| Filter tabs overflow horizontally | /tasks | Medium |
| Week calendar shows only 2 days | /calendar | Medium |
| Task table columns don't fit | /tasks (list view) | High |
| No swipe gestures | Global | Medium |
| Floating Notion logo awkward | Dashboard | Low |
| No pull-to-refresh | Global | Low |
| No haptic feedback | Global | Low |

---

## Goals

1. **Usable on iPhone** — Primary mobile target (390×844 viewport)
2. **Touch-first interactions** — Swipe, tap, long-press
3. **Fast task entry** — Quick add must be frictionless
4. **Readable content** — No truncated text, adequate spacing
5. **Native feel** — Match iOS/Android UX patterns

---

## User Stories

### Must Have
- As a mobile user, I want to see my tasks for today without horizontal scrolling
- As a mobile user, I want to swipe tasks to complete or reschedule them
- As a mobile user, I want to add a task quickly with minimal taps
- As a mobile user, I want to see my calendar in a single-day view on small screens

### Nice to Have
- As a mobile user, I want pull-to-refresh to sync data
- As a mobile user, I want haptic feedback when completing tasks
- As a mobile user, I want to use swipe gestures to navigate between views

---

## Implementation Plan

### Phase 1: Critical Fixes (Week 1) ✅

#### 1.1 Mobile Task List View
**Problem:** Task table columns overflow on mobile

**Solution:**
- Hide organization/project columns on mobile (<640px)
- Show only: checkbox, task name, due indicator, priority dot
- Tap row → open task detail sheet (bottom drawer)
- Long press → quick actions menu

```tsx
// Mobile task row (simplified)
<div className="flex items-center gap-3 py-3 px-4">
  <Checkbox />
  <div className="flex-1 min-w-0">
    <p className="truncate">{task.name}</p>
    <p className="text-xs text-muted">{formatDue(task.due)}</p>
  </div>
  <PriorityDot priority={task.priority} />
</div>
```

#### 1.2 Mobile Calendar View
**Problem:** Week calendar shows too many days, content truncated

**Solution:**
- Single day view on mobile (<640px)
- Horizontal swipe to change days
- Show full task titles (no truncation)
- Date picker in header for quick navigation

```
┌─────────────────────────┐
│ ← Fri, Jan 31    📅 ▼  →│
├─────────────────────────┤
│ 9am  ┌─────────────────┐│
│      │ Team standup    ││
│      └─────────────────┘│
│ 10am                    │
│ 11am ┌─────────────────┐│
│      │ Review PRD      ││
│      └─────────────────┘│
└─────────────────────────┘
```

#### 1.3 Mobile Filter Pills
**Problem:** Filter tabs overflow and require scroll

**Solution:**
- Collapse filters into single "Filters" button on mobile
- Opens bottom sheet with all filter options
- Show active filter count as badge

```
[Calendar ▼] [List] [Filters (2)]
```

### Phase 2: Touch Interactions (Week 2) ✅

#### 2.1 Swipe Actions
- Swipe right → Complete task
- Swipe left → Reschedule (opens date picker)
- Use `react-swipeable` or custom touch handlers

#### 2.2 Bottom Sheet Task Detail
Replace modal with bottom sheet on mobile:
- Slides up from bottom
- Can be dismissed by swipe down
- Full-width, rounded top corners
- Uses `vaul` or similar drawer library

#### 2.3 Quick Add Improvements
- Floating action button (FAB) in bottom right
- Opens bottom sheet, not modal
- Auto-focus on task name input
- "Add and continue" option for bulk entry

### Phase 3: Polish (Week 3) ✅

#### 3.1 Pull to Refresh
- Add `usePullToRefresh` hook
- Trigger React Query refetch
- Show refresh indicator

#### 3.2 Haptic Feedback
```tsx
// Use Tauri haptics on mobile
const completeTask = () => {
  // Vibrate on complete
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
  // ... complete task logic
};
```

#### 3.3 Navigation Gestures
- Swipe from left edge → open sidebar
- Swipe right on page → go back
- Use `react-swipeable-views` for view switching

#### 3.4 Floating Elements Fix
- Move/hide Notion logo on mobile
- Ensure FAB doesn't overlap content
- Add safe area insets for notched devices

---

## Technical Approach

### Responsive Breakpoints
```css
/* Current */
sm: 640px
md: 768px  /* Mobile breakpoint */
lg: 1024px
xl: 1280px

/* Mobile-specific */
@media (max-width: 640px) { /* Phone */ }
@media (max-width: 768px) { /* Phone + Small tablet */ }
@media (pointer: coarse) { /* Touch devices */ }
```

### Component Strategy
1. **Detect mobile in layout** — Use `useMediaQuery` hook
2. **Render different components** — Not just hide/show
3. **Use CSS where possible** — Avoid JS layout shifts

```tsx
// Example: Mobile-aware TaskList
function TaskList({ tasks }) {
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  return isMobile 
    ? <MobileTaskList tasks={tasks} />
    : <DesktopTaskTable tasks={tasks} />;
}
```

### Libraries to Consider
- `vaul` — Bottom sheet/drawer
- `react-swipeable` — Swipe gestures
- `react-swipeable-views` — View navigation
- `framer-motion` — Smooth animations

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Lighthouse mobile score | > 90 |
| Task completion time (mobile) | < 3 taps |
| No horizontal scroll on any page | ✓ |
| Touch targets | ≥ 44×44px |

---

## Out of Scope (v1)

- Native iOS/Android apps (PWA first)
- Offline mode on mobile web (Tauri only)
- Voice input
- Widgets

---

## Open Questions

1. **PWA or native?** — Start with PWA, evaluate native later
2. **Tablet layout?** — Optimize for phone first, tablet gets desktop
3. **Landscape mode?** — Support or lock to portrait?

---

## References

- [Apple HIG - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/touch-targets)
- [Material Design - Mobile](https://m3.material.io/foundations/layout/applying-layout/compact)
- [Vaul Drawer](https://vaul.emilkowal.ski/)
