# PRD: AI-Assisted PRD Workflow

## Overview
Add PRD creation capability to tasks. A task can optionally have a PRD—when enabled, the task modal expands to a focused PRD creation view where you dump context, I analyze it, ask clarifying questions, and generate a structured PRD with subtasks.

**Future vision:** Sashi reviews tasks with PRDs the night before and autonomously works on subtasks overnight, so Paul has a head start in the morning.

---

## Problem
- Writing PRDs is tedious—you have the idea in your head but formalizing it takes time
- Context gets lost between brain dump and structured spec
- No clear path from "idea" → "spec" → "actionable tasks"
- Manual task breakdown is another step that slows things down

## Solution
A PRD mode within tasks that:
1. Lets you dump raw context (notes, ideas, requirements)
2. I analyze and ask targeted clarifying questions
3. Generates a structured PRD
4. Creates subtasks automatically
5. Everything stays within the task

---

## User Flow

### 1. Entry Point
Task modal shows **"Add PRD"** button (or similar) for tasks without a PRD.

Clicking it:
- Expands the modal to a larger, focused view
- Shows the PRD creation interface

### 2. PRD Creation View (Expanded Modal)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to task                                            [X] Close    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Build User Authentication                                              │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Dump your context                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  Users need to log in. Email/password for now, maybe social      │   │
│  │  later. Need password reset. Should persist sessions. Don't      │   │
│  │  want to build 2FA yet. Target is small team, maybe 50 users     │   │
│  │  initially. Should integrate with our existing user table...     │   │
│  │                                                                   │   │
│  │                                                                   │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                                              [Create PRD] ←─ big button │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3. Analysis & Clarification

After clicking "Create PRD":
- Loading state while I analyze the dump
- Then I present clarifying questions in a chat-like interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to task                                            [X] Close    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Build User Authentication                                              │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🤖 I've analyzed your context. A few questions to clarify:      │   │
│  │                                                                   │   │
│  │ 1. For password reset, should users receive an email link or    │   │
│  │    a temporary code?                                             │   │
│  │                                                                   │   │
│  │ 2. "Persist sessions" — how long should sessions last before    │   │
│  │    requiring re-login? Days? Weeks?                              │   │
│  │                                                                   │   │
│  │ 3. Is there any specific security requirement (e.g., password   │   │
│  │    complexity rules, rate limiting on login attempts)?           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Type your answers...                                         ⏎  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

User can:
- Answer questions naturally
- Say "skip" or "not sure" for things to decide later
- Ask me questions back
- Add more context

### 4. PRD Generation

Once I have enough info, I generate the PRD:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to task                                            [X] Close    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Build User Authentication                                    [Edit]    │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ## Problem                                                             │
│  Users cannot save data across sessions or access their account        │
│  from different devices.                                                │
│                                                                         │
│  ## Solution                                                            │
│  Implement email/password authentication with session persistence.     │
│                                                                         │
│  ## Scope                                                               │
│  **In v1:**                                                             │
│  - Email/password signup & login                                        │
│  - Password reset via email link                                        │
│  - 30-day session persistence                                           │
│  - Basic rate limiting (5 attempts/minute)                              │
│                                                                         │
│  **Out of scope:**                                                      │
│  - Social login (Google, GitHub)                                        │
│  - Two-factor authentication                                            │
│  - SSO/SAML                                                             │
│                                                                         │
│  ## Success Metrics                                                     │
│  - 90% signup completion rate                                           │
│  - <2% password reset rate                                              │
│  ...                                                                    │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  🤖 Want me to generate subtasks from this PRD?                        │
│                                                                         │
│  [Generate Subtasks]    [Save PRD Only]                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5. Subtask Generation

If user clicks "Generate Subtasks":

```
Generated 6 subtasks:

☐ Set up auth database schema (users, sessions tables)
☐ Build signup API endpoint with validation
☐ Build login API endpoint with rate limiting
☐ Implement password reset flow (email + token)
☐ Create signup/login UI components
☐ Add session persistence middleware

[Create All]  [Edit First]  [Cancel]
```

Subtasks are created as children of the parent task (linked via `parentId`).

---

## Data Model

### Tasks Table Additions
```sql
ALTER TABLE tasks ADD COLUMN prd TEXT;              -- The generated PRD markdown
ALTER TABLE tasks ADD COLUMN prd_context TEXT;      -- Original dump/context
ALTER TABLE tasks ADD COLUMN prd_chat TEXT;         -- JSON: clarification Q&A history
ALTER TABLE tasks ADD COLUMN parent_id TEXT REFERENCES tasks(id);  -- For subtasks
```

### Subtask Relationship
- Subtasks have `parentId` pointing to parent task
- Query: `SELECT * FROM tasks WHERE parentId = ?`
- Display: Nested under parent in task views

---

## UI Components

### PRDButton (in TaskDetailModal)
```tsx
{!task.prd ? (
  <Button onClick={() => setExpandedMode('prd-create')}>
    <FileText size={14} />
    Add PRD
  </Button>
) : (
  <Button variant="ghost" onClick={() => setExpandedMode('prd-view')}>
    <FileText size={14} />
    View PRD
  </Button>
)}
```

### ExpandedTaskModal
Larger modal (80% viewport or near-fullscreen) for PRD work:
- PRDCreateView — dump field + "Create PRD" button
- PRDClarifyView — chat interface for Q&A
- PRDResultView — rendered PRD + subtask generation

### PRDEditor
- Markdown editor for viewing/editing PRD
- "Regenerate" option to re-run with new context
- "Update Subtasks" to sync changes

---

## API Endpoints

### PATCH /api/tasks/[id]
Extended to handle PRD fields:
```json
{
  "prd": "## Problem\n...",
  "prdContext": "original dump text",
  "prdChat": [{"role": "assistant", "content": "..."}, ...]
}
```

### POST /api/tasks/[id]/generate-prd
Triggers PRD generation:
```json
// Request
{ "context": "Users need to log in..." }

// Response
{
  "questions": [
    "For password reset, should users receive an email link or a temporary code?",
    "How long should sessions last?"
  ]
}
```

### POST /api/tasks/[id]/finalize-prd
After Q&A, generates final PRD:
```json
// Request
{ "answers": "Email link for reset. 30 days for sessions..." }

// Response
{
  "prd": "## Problem\n...",
  "suggestedSubtasks": [
    { "name": "Set up auth database schema", "description": "..." },
    ...
  ]
}
```

### POST /api/tasks/[id]/subtasks
Creates subtasks from suggestions:
```json
// Request
{
  "subtasks": [
    { "name": "Set up auth schema", "description": "..." },
    ...
  ]
}

// Response
{ "created": [...task objects...] }
```

---

## Overnight Automation (Future)

**Vision:** Sashi reviews tasks with PRDs the night before and works on subtasks autonomously.

### How it works:
1. Cron job runs at ~11pm
2. Queries tasks with PRDs that have incomplete subtasks
3. For each actionable subtask (e.g., "write API endpoint"):
   - Sashi works on it using available tools
   - Commits code, updates docs, etc.
   - Marks subtask as "in progress" or "done"
4. Morning summary sent to Paul

### Requirements for this:
- Subtask system (this PRD)
- Clear, actionable subtask descriptions
- Way to mark tasks as "automatable"
- Integration with coding tools (already have via Claude Code)

*This is Phase 2+ after the core PRD workflow ships.*

---

## Phases

### Phase 1: Core PRD Creation (~4-5 days)
- [ ] Add PRD fields to tasks table
- [ ] Expanded modal component
- [ ] Dump field + "Create PRD" button
- [ ] API integration for analysis & questions
- [ ] Q&A chat interface
- [ ] PRD generation & display
- [ ] Save PRD to task

### Phase 2: Subtasks (~2-3 days)
- [ ] Add `parentId` to tasks
- [ ] Subtask generation from PRD
- [ ] Display subtasks nested under parent
- [ ] Subtask completion affects parent progress

### Phase 3: Edit & Iterate (~1-2 days)
- [ ] Edit PRD after creation
- [ ] Regenerate with new context
- [ ] Update subtasks when PRD changes
- [ ] PRD version history (optional)

### Phase 4: Overnight Automation (Future)
- [ ] Cron job for nightly task review
- [ ] Autonomous subtask execution
- [ ] Morning summary notifications

---

## Open Questions

1. **Subtask display:** Inline in task modal? Separate section? Collapsible?
2. **PRD templates:** Should there be different templates for different task types (feature, bug, research)?
3. **Automation scope:** Which subtasks are safe to auto-execute? Need a flag?

---

## Success Metrics

- Time from idea to actionable tasks (target: <5 minutes)
- % of project tasks that have PRDs
- Subtask completion rate for PRD-generated tasks
- (Future) % of overnight work that's usable next morning

---

## Estimate

| Phase | Effort |
|-------|--------|
| Phase 1: Core PRD Creation | 4-5 days |
| Phase 2: Subtasks | 2-3 days |
| Phase 3: Edit & Iterate | 1-2 days |
| **Total MVP** | **7-10 days** |
| Phase 4: Overnight Automation | TBD (future) |
