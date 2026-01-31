# PRD: AI-Assisted PRD & Task Generation

## Overview
Add a "Create PRD" button to the task modal that opens an embedded chat workflow with Sashi. The chat guides the user through creating a PRD, then generates actionable subtasks—all stored within the parent task.

## Problem
- Creating PRDs is time-consuming and easy to skip
- Breaking projects into tasks requires upfront thinking
- Context gets lost between planning and execution
- No structured way to go from idea → spec → tasks

## Solution
A conversational PRD builder that:
1. Lives inside the task modal (no context switching)
2. Asks smart questions to flesh out the idea
3. Generates a structured PRD document
4. Creates subtasks automatically
5. Keeps everything linked to the parent task

---

## User Flow

### 1. Entry Point
- Task modal shows **"Create PRD"** button (next to description, or in overflow menu)
- Button only appears for tasks without an existing PRD
- Tasks with PRDs show **"View PRD"** instead

### 2. PRD Chat Panel
Clicking "Create PRD" opens a side panel or expands the modal:

```
┌─────────────────────────────────────────────────┐
│ Task: Build user authentication                 │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 🤖 Sashi                                    │ │
│ │                                             │ │
│ │ Let's create a PRD for "Build user         │ │
│ │ authentication". I'll ask a few questions. │ │
│ │                                             │ │
│ │ First: What problem does this solve for    │ │
│ │ your users?                                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Type your response...                   ⏎  │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 3. Guided Questions
Sashi asks structured questions to build the PRD:

1. **Problem** — What problem does this solve?
2. **Users** — Who is this for?
3. **Solution** — How should it work? (high-level)
4. **Scope** — What's in v1? What's explicitly out?
5. **Success** — How do we know it worked?
6. **Risks** — What could go wrong?

User can:
- Answer naturally (Sashi extracts structure)
- Skip questions ("skip" or "not sure yet")
- Ask clarifying questions back
- Paste existing notes/context

### 4. PRD Generation
After gathering input, Sashi generates a formatted PRD:

```markdown
# PRD: User Authentication

## Problem
Users currently can't save their data across sessions...

## Users
- New users who want to create accounts
- Returning users who need to log in

## Solution
Implement email/password auth with...

## Scope
### In Scope (v1)
- Email/password signup & login
- Password reset flow
- Session persistence

### Out of Scope
- Social login (Google, GitHub)
- 2FA

## Success Metrics
- 80% of users complete signup
- <5% password reset rate

## Risks & Mitigations
- Risk: Users abandon long signup
- Mitigation: Single-page flow, minimal fields
```

User can:
- **Edit inline** — Make changes directly
- **Ask for changes** — "Make the scope narrower" / "Add a risk about security"
- **Approve** — "Looks good" / click "Save PRD"

### 5. Task Generation
After PRD approval, Sashi offers to generate tasks:

```
🤖 PRD saved! Want me to generate tasks from this?

[Generate Tasks]  [Skip for now]
```

If yes, Sashi creates subtasks:
- `Set up auth database schema`
- `Build signup API endpoint`
- `Build login API endpoint`
- `Create signup form UI`
- `Create login form UI`
- `Implement password reset flow`
- `Add session persistence`

Tasks are created as **subtasks** of the parent task (or linked tasks if subtasks aren't implemented yet).

---

## Data Model

### Option A: PRD in Task Description
- Store PRD markdown in `task.description`
- Simple, no schema changes
- Con: Mixes PRD with other notes

### Option B: Separate PRD Field (Recommended)
```sql
ALTER TABLE tasks ADD COLUMN prd TEXT;
ALTER TABLE tasks ADD COLUMN prd_chat_history TEXT; -- JSON array of messages
```

- `prd` — The generated PRD markdown
- `prd_chat_history` — Conversation history for context/editing

### Subtasks
Requires subtask support (separate feature):
```sql
ALTER TABLE tasks ADD COLUMN parent_id TEXT REFERENCES tasks(id);
```

Or use a simpler linking approach:
```sql
CREATE TABLE task_links (
  id TEXT PRIMARY KEY,
  source_task_id TEXT REFERENCES tasks(id),
  target_task_id TEXT REFERENCES tasks(id),
  link_type TEXT -- 'subtask', 'blocks', 'related'
);
```

---

## Technical Implementation

### Chat Interface
- Reuse existing chat patterns or build minimal chat UI
- Messages stored in `prd_chat_history` as JSON
- Stream responses for better UX

### AI Integration
- Call Clawdbot/Sashi API for responses
- System prompt guides PRD creation flow
- Context: task name, org, project, existing description

### PRD Editor
- Markdown editor (reuse RichEditor or use simple textarea)
- Live preview optional
- Auto-save on blur

### Task Generation
- Parse PRD sections to identify actionable items
- Create tasks via existing `/api/tasks` endpoint
- Link to parent task

---

## UI Components

### PRDButton
```tsx
// In TaskDetailModal
{!task.prd ? (
  <Button onClick={() => setShowPRDChat(true)}>
    <Sparkles size={14} />
    Create PRD
  </Button>
) : (
  <Button variant="ghost" onClick={() => setShowPRD(true)}>
    <FileText size={14} />
    View PRD
  </Button>
)}
```

### PRDChatPanel
- Slide-out panel or modal expansion
- Message list + input
- "Generate PRD" button when ready
- PRD preview with edit capability

### PRDViewer
- Read-only markdown render
- "Edit" button to re-enter chat
- "Regenerate Tasks" option

---

## Phases

### Phase 1: Basic PRD Chat (~3-4 days)
- Add `prd` column to tasks
- Build chat UI in task modal
- Hardcoded question flow (no AI yet, just structured form)
- Generate markdown PRD from answers
- Store in task

### Phase 2: AI Integration (~2-3 days)
- Connect to Clawdbot API
- Dynamic conversation flow
- Smart PRD generation
- Inline editing via chat

### Phase 3: Task Generation (~2 days)
- Parse PRD for actionable items
- Generate subtasks (requires subtask support)
- Or generate linked tasks

### Phase 4: Polish (~1-2 days)
- Streaming responses
- Better markdown editor
- PRD templates
- Export to Notion/docs

---

## Open Questions

1. **Subtasks first?** — Should we build subtask support before this, or use linked tasks?
2. **Where does chat live?** — Side panel vs expanded modal vs separate page?
3. **AI model** — Use main Sashi session or spawn dedicated agent?
4. **Offline/async** — What if user closes mid-conversation?

---

## Success Metrics

- % of project tasks that have PRDs
- Time from task creation to PRD completion
- # of generated tasks accepted vs deleted
- User feedback on PRD quality

---

## Estimate

| Phase | Effort |
|-------|--------|
| Phase 1: Basic PRD Chat | 3-4 days |
| Phase 2: AI Integration | 2-3 days |
| Phase 3: Task Generation | 2 days |
| Phase 4: Polish | 1-2 days |
| **Total** | **8-11 days** |

Could ship Phase 1 as MVP in ~4 days, then iterate.
