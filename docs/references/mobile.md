# Mobile Optimization Feature Reference

## Overview

Sashi UI is optimized for mobile devices with touch-first interactions, swipe gestures, bottom sheet modals, and responsive layouts. The mobile experience prioritizes quick task management with minimal taps.

## Key Files

| File | Purpose |
|------|---------|
| [src/components/MobileTaskList.tsx](../../src/components/MobileTaskList.tsx) | Mobile task list |
| [src/components/MobileTaskRow.tsx](../../src/components/MobileTaskRow.tsx) | Swipeable task row |
| [src/components/MobileTaskDetail.tsx](../../src/components/MobileTaskDetail.tsx) | Bottom sheet detail |
| [src/components/MobileDayCalendar.tsx](../../src/components/MobileDayCalendar.tsx) | Single-day view |
| [src/components/MobileFilters.tsx](../../src/components/MobileFilters.tsx) | Filter bottom sheet |
| [src/components/PullToRefresh.tsx](../../src/components/PullToRefresh.tsx) | Pull-to-refresh |
| [src/lib/hooks/use-media-query.ts](../../src/lib/hooks/use-media-query.ts) | Responsive detection |
| [src/lib/hooks/use-pull-to-refresh.ts](../../src/lib/hooks/use-pull-to-refresh.ts) | Pull gesture |

## Responsive Breakpoints

```typescript
// Breakpoint detection
const isMobile = useMediaQuery('(max-width: 639px)');    // < 640px
const isTablet = useMediaQuery('(max-width: 767px)');    // < 768px
const isDesktop = useMediaQuery('(min-width: 1024px)');  // >= 1024px
```

| Breakpoint | Device | UI Mode |
|------------|--------|---------|
| < 640px | Phone | Mobile components |
| 640-767px | Small tablet | Hybrid |
| 768-1023px | Tablet | Desktop-like |
| >= 1024px | Desktop | Full desktop |

## Key Features

### Swipe Gestures
- **Swipe right** - Complete task (check icon revealed)
- **Swipe left** - Reschedule task (calendar icon revealed)
- **Uses** `react-swipeable` for gesture detection

```typescript
// MobileTaskRow swipe handling
const handlers = useSwipeable({
  onSwipedRight: () => completeTask(task.id),
  onSwipedLeft: () => openReschedule(task.id),
  trackMouse: false,
});
```

### Bottom Sheet Modals
- **Vaul drawer** - Slide-up sheets for task details
- **Native feel** - Drag to dismiss
- **Full-screen option** - For complex forms

```typescript
import { Drawer } from 'vaul';

<Drawer.Root>
  <Drawer.Trigger>Open</Drawer.Trigger>
  <Drawer.Portal>
    <Drawer.Content>
      {/* Task detail content */}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```

### Pull-to-Refresh
- **Custom hook** - `use-pull-to-refresh.ts`
- **Visual indicator** - Spinner during refresh
- **Triggers data refetch** - Via React Query invalidation

```typescript
const { refreshing, handleTouchStart, handleTouchMove, handleTouchEnd } =
  usePullToRefresh({
    onRefresh: async () => {
      await queryClient.invalidateQueries(['tasks']);
    },
  });
```

### Single-Day Calendar
- **MobileDayCalendar** - Shows one day at a time
- **Swipe navigation** - Between days
- **Compact layout** - Fits phone screens

## Touch Targets

All interactive elements meet minimum touch target sizes:

| Element | Minimum Size |
|---------|-------------|
| Buttons | 44x44px |
| List items | 48px height |
| Icons | 24x24px with 44x44px touch area |
| Inputs | 44px height |

## Mobile-Specific Components

### MobileTaskList
- Vertical list with swipeable rows
- Pull-to-refresh enabled
- Floating action button for new task

### MobileTaskRow
- Full-width swipeable card
- Shows: name, status indicator, due date
- Swipe reveals actions

### MobileTaskDetail
- Bottom sheet (Vaul drawer)
- Scrollable content
- Sticky header with close button

### MobileFilters
- Bottom sheet filter UI
- Multi-select status, priority
- Apply/Clear buttons

## Layout Patterns

### Conditional Rendering

```typescript
const isMobile = useMediaQuery('(max-width: 639px)');

return (
  <>
    {isMobile ? (
      <MobileTaskList tasks={tasks} />
    ) : (
      <TaskTable tasks={tasks} />
    )}
  </>
);
```

### Responsive CSS

```css
/* Desktop-first with mobile overrides */
.task-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 639px) {
  .task-list {
    grid-template-columns: 1fr;
  }
}
```

## Performance Considerations

- **Lazy loading** - Components loaded only when needed
- **Virtualization** - For long lists (TanStack Virtual)
- **Optimistic updates** - Instant feedback before server response
- **Image optimization** - Appropriate sizes for screen

## Related Components

- `AppLayout.tsx` - Responsive shell
- `Sidebar.tsx` - Collapsible on mobile
- `TaskDetailModal.tsx` - Uses Vaul on mobile

## Related PRDs

- [PRD-mobile](../PRD-mobile.md) - Full specification
