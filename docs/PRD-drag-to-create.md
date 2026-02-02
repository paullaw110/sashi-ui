# PRD: Drag-to-Create Events

**Status:** 🟡 In Progress  
**Created:** 2026-02-02  
**Author:** Sashi

## Overview

Enable users to create tasks/events by clicking and dragging on empty time slots in the TimeWeekCalendar. Dragging selects a time range, and releasing opens a creation modal pre-filled with the selected date and time range. This matches how Notion Calendar and Google Calendar handle event creation.

## Problem Statement

Currently, creating a timed task requires:
1. Opening a task modal (or using quick-add)
2. Manually setting the date
3. Manually setting the start time
4. Manually setting the duration

This is friction-heavy for calendar-based planning. Users should be able to visually "paint" time blocks directly on the calendar.

## User Stories

1. As a user, I want to drag on an empty time slot to create an event so that I can quickly schedule tasks visually
2. As a user, I want to see a preview of the time range as I drag so that I know exactly what I'm selecting
3. As a user, I want the creation modal to open pre-filled with my selected time so that I don't have to re-enter it
4. As a user, I want to drag across hour boundaries so that I can create events of any duration

## Solution

### UX Flow

1. **Initiate:** User clicks on empty area in a day column (not on existing task)
2. **Drag:** While holding, user drags down (or up) to extend selection
3. **Preview:** A ghost block appears showing the time range being selected
4. **Release:** On mouse up, open TaskModal with:
   - `dueDate` = selected day
   - `dueTime` = start of selection (earlier time)
   - `duration` = calculated from selection height
5. **Confirm:** User enters task name, optionally adjusts fields, saves
6. **Cancel:** Clicking outside modal or pressing Escape cancels creation

### Visual Behavior

```
┌─────────────────────────────────────┐
│  9 AM  │     │     │ ░░░░░ │     │  │  ← User clicks here
├────────┼─────┼─────┼───────┼─────┼──┤
│ 10 AM  │     │     │ ░░░░░ │     │  │  ← Dragging down...
├────────┼─────┼─────┼───────┼─────┼──┤
│ 11 AM  │     │     │ ░░░░░ │     │  │  ← Selection preview
├────────┼─────┼─────┼───────┼─────┼──┤
│ 12 PM  │     │     │       │     │  │  ← Released here
└─────────────────────────────────────┘

Preview shows: "9:00 AM – 12:00 PM (3h)"
```

### UI Components

#### 1. DragCreateSelection
A positioned overlay that appears during drag:
- Semi-transparent lime/accent background
- Rounded corners matching task cards
- Time range label at top or floating tooltip
- Snaps to 15-minute increments

```tsx
interface DragCreateSelection {
  dateKey: string;
  startMinutes: number;  // From midnight
  endMinutes: number;    // From midnight
  isCreating: boolean;
}
```

#### 2. Updated Day Column
- Track mousedown on empty areas (not on tasks)
- Track mousemove during drag for preview
- Track mouseup to finalize and open modal

#### 3. TaskModal Enhancement
- Accept optional `initialData` prop for pre-filled values
- New fields: `dueDate`, `dueTime`, `duration`

### Interaction Details

| Action | Behavior |
|--------|----------|
| Click (no drag) | No action on empty space (prevents accidental creation) |
| Click + drag < 15min | Minimum 15-minute event |
| Drag up from start | Extends backward (start becomes new start) |
| Drag past day boundary | Clamp to current day |
| Drag onto existing task | Show visual conflict indicator |
| Escape during drag | Cancel creation |
| Release on valid area | Open modal |

### Time Snapping

All times snap to **15-minute increments**:
- 9:07 → 9:00
- 9:08 → 9:15
- Maintains consistency with existing resize behavior

### API Requirements

No new API endpoints needed. Uses existing:
- `POST /api/tasks` — Create task with `dueDate`, `dueTime`, `duration`

### Task Creation Payload

```typescript
{
  name: string;           // From modal input
  dueDate: "2026-02-02";  // From drag selection
  dueTime: "09:00";       // From drag start
  duration: 180;          // In minutes, from drag range
  status: "todo";         // Default
  // ... other optional fields from modal
}
```

## Technical Implementation

### Phase 1: Drag Selection Tracking
- [ ] Add `isDragCreating` state to TimeWeekCalendar
- [ ] Add `dragCreateData` state: `{ dateKey, startY, currentY, startMinutes, endMinutes }`
- [ ] Handle `onMouseDown` on day column (check if target is empty space)
- [ ] Handle `onMouseMove` during drag to update selection
- [ ] Handle `onMouseUp` to finalize selection
- [ ] Render `DragCreateSelection` component when active

### Phase 2: Selection Preview UI
- [ ] Create `DragCreateSelection` styled component
- [ ] Position absolutely based on `startMinutes` and `endMinutes`
- [ ] Show time range tooltip (e.g., "9:00 AM – 11:30 AM")
- [ ] Animate opacity on appear
- [ ] Match design system (lime accent, semi-transparent)

### Phase 3: Modal Integration
- [ ] Add `initialData` prop to TaskModal
- [ ] Pre-fill `dueDate`, `dueTime`, `duration` from selection
- [ ] Focus task name input on open
- [ ] Close and reset on cancel or successful save

### Phase 4: Edge Cases & Polish
- [ ] Prevent drag-create while existing DnD drag is active
- [ ] Handle minimum duration (15 minutes)
- [ ] Handle drag up (reverse direction)
- [ ] Add escape key handler to cancel during drag
- [ ] Cursor changes: `crosshair` while dragging on empty, `grab` on tasks

## Acceptance Criteria

- [ ] User can click and drag on empty calendar space to create selection
- [ ] Selection preview shows time range with 15-minute snapping
- [ ] Releasing opens TaskModal pre-filled with date, time, and duration
- [ ] Saving creates task that appears immediately on calendar
- [ ] Canceling modal clears selection without creating task
- [ ] Cannot drag-create on top of existing tasks (visual feedback)
- [ ] Works with keyboard (Escape cancels)
- [ ] Touch support (stretch goal)

## Test Scenarios

```gherkin
Feature: Drag to Create Events

  Scenario: Create a 2-hour event via drag
    Given I am on the Dashboard with week view visible
    When I click at 9:00 AM on Wednesday and drag to 11:00 AM
    Then I see a selection preview showing "9:00 AM – 11:00 AM"
    When I release the mouse
    Then the task creation modal opens
    And the date is pre-filled with Wednesday's date
    And the time is pre-filled with "09:00"
    And the duration is pre-filled with 120 minutes

  Scenario: Cancel drag creation with Escape
    Given I am dragging to create an event
    When I press the Escape key
    Then the selection preview disappears
    And no modal opens

  Scenario: Minimum duration enforcement
    Given I am on the Dashboard with week view visible
    When I click at 9:00 AM and drag only 5 pixels down
    And I release the mouse
    Then the duration is set to 15 minutes minimum

  Scenario: Drag in reverse direction
    Given I am on the Dashboard with week view visible
    When I click at 11:00 AM and drag UP to 9:00 AM
    Then the selection shows "9:00 AM – 11:00 AM"
    And the start time is 9:00 AM (earlier time)
```

## Design Specifications

### Selection Preview (Match Notion Calendar)
- **Background:** `var(--accent-primary)` at 30% opacity (lime tint)
- **Border:** 2px solid `var(--accent-primary)` 
- **Border radius:** 6px (matches task cards)
- **Min height:** 12px (15 minutes)
- **Visual behavior:** Solid colored box that expands as you drag (like Notion's orange box)
- **Reference:** Notion Calendar drag selection (see attached screenshot)

### Time Tooltip
- **Position:** Top of selection, or floating near cursor if selection is small
- **Background:** `var(--bg-elevated)`
- **Border:** 1px solid `var(--border-default)`
- **Text:** 11px, `var(--text-primary)`
- **Padding:** 4px 8px
- **Shadow:** Standard elevation shadow

### Cursor States
| State | Cursor |
|-------|--------|
| Hovering empty space | `crosshair` |
| Actively dragging | `crosshair` |
| Hovering task | `grab` |
| Dragging task | `grabbing` |

### Animation
- Selection preview: `opacity` transition 100ms ease-out on appear
- No animation on drag movement (instant feedback)

## Out of Scope

- Multi-day event creation (drag across columns)
- Touch/mobile drag-to-create (different UX needed)
- Drag-to-create in MonthCalendar view
- Conflict resolution when dragging over existing tasks
- Recurring event creation from drag

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Conflict with existing DnD for task moving | Check `activeId` before allowing drag-create |
| Accidental creation on single click | Require minimum drag distance (5px) before showing preview |
| Confusion between dragging task vs creating | Different cursors, only works on empty space |
| Performance on rapid drag updates | Throttle position updates to 60fps, use CSS transforms |

## Dependencies

- Existing `TaskModal` component
- Existing `useCreateTask` hook
- DnD kit (already installed, but we'll use native mouse events for this)

## Open Questions

1. ~~**Side panel vs modal?**~~ — **DECIDED: Modal** (consistent with existing edit flow)
2. **Should clicking (without drag) also create?** — Leaning no, too easy to misclick. But could add as setting later.
3. **Duration in modal display?** — Show as "2 hours" or "9:00 AM – 11:00 AM" or both? Both feels cleanest.
