# Calendar & Events Feature Reference

## Overview

The Calendar feature provides week and month views for visualizing tasks and events over time. Events are separate from tasks and support recurring patterns via RRULE (RFC 5545). The calendar supports drag-and-drop for scheduling and rescheduling.

## Key Files

| File | Purpose |
|------|---------|
| [src/app/calendar/page.tsx](../../src/app/calendar/page.tsx) | Calendar page server component |
| [src/components/CalendarView.tsx](../../src/components/CalendarView.tsx) | Main calendar container |
| [src/components/TimeWeekCalendar.tsx](../../src/components/TimeWeekCalendar.tsx) | Week view with hour slots |
| [src/components/WeekCalendar.tsx](../../src/components/WeekCalendar.tsx) | Simple week card view |
| [src/components/MonthCalendar.tsx](../../src/components/MonthCalendar.tsx) | Month overview |
| [src/components/EventDetailModal.tsx](../../src/components/EventDetailModal.tsx) | Event editing modal |
| [src/components/RecurrenceEditor.tsx](../../src/components/RecurrenceEditor.tsx) | RRULE configuration |
| [src/lib/hooks/use-events.ts](../../src/lib/hooks/use-events.ts) | Event CRUD hooks |
| [src/app/api/events/route.ts](../../src/app/api/events/route.ts) | Events API endpoint |

## Database Schema

```sql
events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date INTEGER NOT NULL,    -- timestamp_ms
  start_time TEXT,                 -- HH:mm format, null for all-day
  end_time TEXT,                   -- HH:mm format
  is_all_day INTEGER DEFAULT 0,
  color TEXT DEFAULT '#EFFF83',    -- Brand lime color
  recurrence_rule TEXT,            -- RRULE string
  recurrence_end INTEGER,          -- timestamp_ms
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)

event_exceptions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  original_date INTEGER NOT NULL,  -- Which occurrence this modifies
  is_cancelled INTEGER DEFAULT 0,
  modified_name TEXT,
  modified_start_time TEXT,
  modified_end_time TEXT,
  modified_location TEXT,
  created_at INTEGER NOT NULL
)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET | List events (with date range) |
| `/api/events` | POST | Create event |
| `/api/events/:id` | GET | Get single event |
| `/api/events/:id` | PATCH | Update event |
| `/api/events/:id` | DELETE | Delete event |

## Query Parameters

```
GET /api/events?start=2026-02-01&end=2026-02-28  // Date range
```

## Key Features

### Calendar Views
- **Week view** - Hour slots (Google Calendar style)
- **Month view** - Overview of all events
- **Time indicator** - Notion-style current time line
- **Side-by-side** - Overlapping events display properly

### Event Management
- **All-day events** - `isAllDay` flag, no time
- **Timed events** - Start time and end time
- **Location** - Optional venue/place
- **Colors** - Visual organization

### Recurring Events
- **RRULE format** - RFC 5545 standard
- **Examples**:
  - `FREQ=DAILY` - Every day
  - `FREQ=WEEKLY;BYDAY=MO,WE,FR` - Mon/Wed/Fri
  - `FREQ=MONTHLY;BYMONTHDAY=1` - First of month
- **End date** - Optional series end
- **Exceptions** - Modify single occurrences

### Drag and Drop
- **Task scheduling** - Drag tasks to calendar slots
- **Event rescheduling** - Move events between days/times
- **Duration preservation** - Maintains event length
- **Resize** - Drag edge to change duration

## Recurring Event Expansion

```typescript
import { RRule } from 'rrule';

// Expand recurring event into instances
const rule = RRule.fromString(event.recurrenceRule);
const occurrences = rule.between(startDate, endDate);

// Apply exceptions
const instances = occurrences.map(date => {
  const exception = exceptions.find(e =>
    e.originalDate === date.getTime()
  );
  if (exception?.isCancelled) return null;
  return {
    ...event,
    startDate: date,
    ...(exception ?? {}),
  };
}).filter(Boolean);
```

## Mobile Support

- `MobileDayCalendar.tsx` - Single-day view for small screens
- Touch-optimized targets
- Swipe navigation between days

## Related Components

- `TaskTable.tsx` - Tasks shown on calendar
- `Dashboard.tsx` - Embeds week calendar
- `QuickAddTask.tsx` - Cmd+K quick creation

## Related PRDs

- [PRD-drag-to-create](../PRD-drag-to-create.md) - Implemented (drag on calendar to create events)
