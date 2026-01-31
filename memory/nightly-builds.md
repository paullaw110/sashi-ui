# Nightly Builds Tracker

Paul's request: Build something small but helpful every night while he sleeps using Codex CLI.

## Build Ideas Queue

### sashi-ui Improvements
- [x] Quick-add task keyboard shortcut (Cmd+K) ✅
- [ ] Task search/filter bar
- [ ] Drag tasks between status columns on Tasks page
- [ ] Calendar event tooltips on hover
- [ ] Weekly summary view
- [ ] Task time tracking (start/stop timer)
- [ ] Recurring tasks
- [ ] Task templates
- [ ] Keyboard navigation (j/k to move, enter to open)
- [ ] Dark/light mode toggle

### Workflow Tools
- [ ] Daily standup generator (summarize yesterday's completed tasks)
- [ ] Slack digest bot (summarize channel activity)
- [ ] Project health dashboard
- [ ] Automated PR review reminder
- [ ] Meeting prep generator (gather context before calendar events)

### Automation Scripts
- [ ] Auto-archive completed tasks older than 7 days
- [ ] Weekly metrics email (tasks completed, time spent)
- [ ] Notion sync improvements
- [ ] Lead scoring automation for Superlandings

### Communication
- [ ] Slack thread summarizer
- [ ] Daily briefing generator
- [ ] Smart notification batching

---

## Completed Builds

### Quick-Add Task Keyboard Shortcut (Cmd+K)
- **Date:** 2025-01-28
- **Scope:** Global keyboard shortcut for task creation
- **Details:** Added Cmd+K (or Ctrl+K) shortcut that opens a modal for quick task creation from anywhere in the app
- **Components:** QuickAddTask component, updated AppLayout with global listener
- **Live URL:** https://sashi-ae2nk89tu-lawrencepdesign-6665s-projects.vercel.app

---

## Build Log

### Night 1 (Manual Run) - 2025-01-28
- **Built:** Quick-add task keyboard shortcut (Cmd+K)
- **Location:** https://sashi-ae2nk89tu-lawrencepdesign-6665s-projects.vercel.app
- **Notes:** 
  - Created QuickAddTask modal component with clean UI
  - Added global keyboard listener to AppLayout (Cmd+K or Ctrl+K)
  - Works from any page in the app
  - Simple enter-to-create workflow for maximum efficiency
  - No errors in Playwright testing
  - Successfully deployed to Vercel production 
