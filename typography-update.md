# Typography System Update

## New Typography Scale
Based on Paul's reference, establishing body text as ~14-16px (text-sm/text-base) and scaling everything else relative to that.

### New Scale (Tailwind Classes)
- **Display/Page Headers:** text-2xl (24px) - Page titles
- **Section Headers:** text-xl (20px) - "Today", "Next" sections  
- **Component Headers:** text-lg (18px) - Table headers, panel titles
- **Body Text (NEW BASELINE):** text-sm (14px) - Task names, main content
- **Secondary Text:** text-xs (12px) - Metadata, times, status
- **Caption Text:** text-[10px] - Very small labels, badges
- **Fine Print:** text-[8px] - Minimal use only

### Components to Update

#### High Priority
1. **TaskTable** - task names, project names
2. **TasksView** - list view task names  
3. **MonthCalendar** - already updated
4. **WeekCalendar** - task names
5. **TaskSidePanel/Modal** - form labels and content

#### Medium Priority  
1. **AppLayout** - navigation, headers
2. **Dashboard** - section headers
3. **TaskTable headers** - column labels
4. **Breadcrumbs** - org/project navigation

#### Lower Priority
1. **Buttons** - button text
2. **Forms** - input labels
3. **Status badges** - priority/status text
4. **Tooltips** - help text

## Implementation Plan
1. Update core task display components first
2. Update headers and navigation
3. Update forms and secondary UI
4. Test across all views for consistency