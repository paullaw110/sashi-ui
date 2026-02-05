# PRD: Mission Control (Multi-Agent System)

## Overview
Transform sashi-ui into Mission Control — a coordination hub for multiple AI agents working as a team. Replaces the Queue tab with a real-time agent collaboration system.

**Inspiration:** [@pbteja1998's Mission Control](https://x.com/pbteja1998/status/2017662163540971756) (3.4M views)

## Goals
1. Run multiple specialized AI agents that collaborate on tasks
2. Provide visibility into what each agent is doing
3. Enable agent-to-agent communication via @mentions
4. Track task progress across the squad

## The Squad (Initial)

| Agent | Role | Model | Personality |
|-------|------|-------|-------------|
| **Sashi** | Squad Lead | Opus | Direct, sharp, takes charge. Coordinates and delegates. |
| **Kira** | Researcher | Sonnet | Deep researcher. Every claim has receipts. Finds insights others miss. |
| **Mu** | Designer/Frontend | Sonnet | Visual thinker. UI/UX expert. Thinks in components and systems. |

Future agents: Content Writer, SEO Analyst, Developer, etc.

---

## Phase 1: Database Schema & API

### New Tables

```sql
-- agents table
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  avatar TEXT, -- emoji or image URL
  status TEXT DEFAULT 'idle', -- idle | active | blocked
  session_key TEXT NOT NULL, -- e.g., "agent:kira:main"
  model TEXT, -- e.g., "anthropic/claude-sonnet-4-20250514"
  current_task_id TEXT REFERENCES tasks(id),
  last_active_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- task_comments table (thread on tasks)
CREATE TABLE task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  content TEXT NOT NULL,
  attachments TEXT, -- JSON array of document IDs
  created_at INTEGER DEFAULT (unixepoch())
);

-- activity_feed table
CREATE TABLE activity_feed (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- task_created | task_updated | comment_added | agent_status_changed | document_created
  agent_id TEXT REFERENCES agents(id),
  task_id TEXT REFERENCES tasks(id),
  message TEXT NOT NULL,
  metadata TEXT, -- JSON for extra context
  created_at INTEGER DEFAULT (unixepoch())
);

-- notifications table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  mentioned_agent_id TEXT NOT NULL REFERENCES agents(id),
  from_agent_id TEXT REFERENCES agents(id),
  task_id TEXT REFERENCES tasks(id),
  comment_id TEXT REFERENCES task_comments(id),
  content TEXT NOT NULL,
  delivered BOOLEAN DEFAULT FALSE,
  read BOOLEAN DEFAULT FALSE,
  created_at INTEGER DEFAULT (unixepoch())
);

-- task_subscriptions table (auto-subscribe to threads)
CREATE TABLE task_subscriptions (
  task_id TEXT NOT NULL REFERENCES tasks(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  created_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (task_id, agent_id)
);
```

### API Endpoints

```
GET    /api/agents              - List all agents with status
GET    /api/agents/:id          - Get agent details
PATCH  /api/agents/:id          - Update agent (status, current_task)

GET    /api/tasks/:id/comments  - Get comments on a task
POST   /api/tasks/:id/comments  - Add comment (parses @mentions)

GET    /api/activity            - Get activity feed (paginated)
POST   /api/activity            - Log activity

GET    /api/notifications       - Get notifications for agent
PATCH  /api/notifications/:id   - Mark as delivered/read
```

### Deliverables
- [ ] Add tables to schema.ts
- [ ] Create migration
- [ ] Build API routes
- [ ] Add @mention parsing utility

---

## Phase 2: Mission Control UI (Replace Queue)

### Navigation Change
- Remove "Queue" from sidebar
- Add "Mission Control" with activity icon
- URL: `/mission-control` (redirect `/queue` → `/mission-control`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Mission Control                                    [+ Task] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ ⚡ Sashi    │ │ 🔍 Kira    │ │ 🎨 Mu       │           │
│  │ Squad Lead │ │ Researcher │ │ Designer    │           │
│  │ ● Active   │ │ ○ Idle     │ │ ● Active    │           │
│  │ Working on:│ │             │ │ Working on: │           │
│  │ PRD Review │ │             │ │ UI Mockup   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Activity Feed                              [Filter ▼]      │
├─────────────────────────────────────────────────────────────┤
│  ⚡ Sashi created task "Mission Control PRD"      2m ago   │
│  🎨 Mu commented on "Dashboard redesign"          5m ago   │
│  🔍 Kira completed research for "Competitor..."   12m ago  │
│  ⚡ Sashi assigned "SEO audit" to Kira            15m ago  │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

### Agent Cards
- Avatar (emoji)
- Name and role
- Status indicator (green=active, gray=idle, red=blocked)
- Current task (if any, clickable)
- Last active timestamp

### Activity Feed
- Real-time updates (polling or websocket)
- Filter by agent, activity type
- Click to navigate to task/comment
- Grouped by time (Today, Yesterday, This Week)

### Deliverables
- [ ] Create MissionControl page component
- [ ] Build AgentCard component
- [ ] Build ActivityFeed component
- [ ] Update sidebar navigation
- [ ] Add redirect from /queue

---

## Phase 3: Task Comments & @Mentions

### Task Detail Enhancement
Add comments section to TaskDetailModal:

```
┌─────────────────────────────────────────────────────────────┐
│ Task: Build comparison page                        [Status] │
├─────────────────────────────────────────────────────────────┤
│ Description...                                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Comments (4)                                                │
├─────────────────────────────────────────────────────────────┤
│ ⚡ Sashi · 2h ago                                           │
│ @Kira can you research competitor pricing first?            │
│                                                             │
│ 🔍 Kira · 1h ago                                            │
│ Done. Found 3 competitors. See attached research doc.       │
│ 📎 competitor-research.md                                   │
│                                                             │
│ 🎨 Mu · 45m ago                                             │
│ Starting on the UI mockup. @Sashi any brand guidelines?     │
│                                                             │
│ ⚡ Sashi · 30m ago                                          │
│ Use the existing design system. Lime accent.                │
├─────────────────────────────────────────────────────────────┤
│ [Write a comment... @mention agents]            [Post]      │
└─────────────────────────────────────────────────────────────┘
```

### @Mention Behavior
1. Type `@` → show agent picker dropdown
2. On post, parse `@AgentName` patterns
3. Create notification for mentioned agent
4. Auto-subscribe mentioned agent to thread
5. Auto-subscribe commenter to thread

### Thread Subscriptions
- Once subscribed, get notified of ALL future comments
- Can unsubscribe manually
- Shows "Subscribed" badge on task card

### Deliverables
- [ ] TaskComments component
- [ ] CommentInput with @mention autocomplete
- [ ] @mention parser utility
- [ ] Subscription management
- [ ] Update TaskDetailModal

---

## Phase 4: Agent Configuration (Clawdbot Side)

### Add Agents to Clawdbot

```bash
# Add Kira
clawdbot agents add kira \
  --workspace /Users/sashi/clawd/agents/kira \
  --model anthropic/claude-sonnet-4-20250514

# Add Mu  
clawdbot agents add mu \
  --workspace /Users/sashi/clawd/agents/mu \
  --model anthropic/claude-sonnet-4-20250514
```

### Agent Workspace Structure

```
/Users/sashi/clawd/agents/kira/
├── SOUL.md           # Kira's personality
├── AGENTS.md         # Operating instructions (shared template)
├── HEARTBEAT.md      # What to check on wake
├── memory/
│   ├── WORKING.md    # Current task state
│   └── YYYY-MM-DD.md # Daily notes
```

### SOUL.md Examples

**Kira (Researcher):**
```markdown
# SOUL.md — Who You Are

**Name:** Kira
**Role:** Researcher
**Emoji:** 🔍

## Personality
Deep investigator. Thorough. Every claim has a source.
You find insights others miss. You question assumptions.
Provide confidence levels with findings.

## What You're Good At
- Competitive research and analysis
- Finding patterns in data
- Synthesizing multiple sources
- Fact-checking and verification

## What You Care About
- Accuracy over speed
- Primary sources over summaries
- Actionable insights over raw data
```

**Mu (Designer):**
```markdown
# SOUL.md — Who You Are

**Name:** Mu
**Role:** Designer / Frontend Developer
**Emoji:** 🎨

## Personality
Visual thinker. Systems-minded. You see the big picture
and the pixel-level details. You care about craft.

## What You're Good At
- UI/UX design and critique
- Design systems and components
- Frontend implementation (React, Tailwind)
- Visual problem-solving

## What You Care About
- User experience over technical elegance
- Consistency and polish
- Accessibility
- Design that serves the goal
```

### Heartbeat Cron Jobs

```bash
# Kira heartbeat (every 15 min, offset :02)
clawdbot cron add \
  --name "kira-heartbeat" \
  --cron "2,17,32,47 * * * *" \
  --session "agent:kira:main" \
  --message "HEARTBEAT: Check Mission Control for @mentions and assigned tasks. Read WORKING.md first. If nothing needs attention, reply HEARTBEAT_OK."

# Mu heartbeat (every 15 min, offset :05)
clawdbot cron add \
  --name "mu-heartbeat" \
  --cron "5,20,35,50 * * * *" \
  --session "agent:mu:main" \
  --message "HEARTBEAT: Check Mission Control for @mentions and assigned tasks. Read WORKING.md first. If nothing needs attention, reply HEARTBEAT_OK."
```

### Deliverables
- [ ] Create agent workspaces
- [ ] Write SOUL.md for each agent
- [ ] Create shared AGENTS.md template
- [ ] Set up heartbeat crons
- [ ] Test agent spawning

---

## Phase 5: Notification Delivery System

### How It Works
1. Comment with @mention creates notification record
2. Background process checks for undelivered notifications
3. Uses `sessions_send` to deliver to agent's session
4. Marks notification as delivered

### Implementation Options

**Option A: Cron-based (Simple)**
- Cron job runs every 2 minutes
- Queries undelivered notifications
- Sends via Clawdbot sessions_send
- Marks delivered

**Option B: Real-time daemon (Like the original)**
- Node.js script running via pm2
- Polls database every 2-5 seconds
- More responsive but more complex

### Recommendation
Start with Option A (cron-based). Upgrade to Option B if latency matters.

### Notification Format
```
📬 You were mentioned by Sashi on "Build comparison page":

"@Kira can you research competitor pricing first?"

View task: https://sashi-ui.vercel.app/tasks?id=xxx
```

### Deliverables
- [ ] Create notification delivery script
- [ ] Set up cron job or daemon
- [ ] Test end-to-end @mention flow

---

## Phase 6: Daily Standup

### Automated Summary
Cron job at 11 PM that:
1. Queries all activity from today
2. Groups by agent
3. Summarizes completed, in-progress, blocked
4. Posts to Slack #general

### Format
```
📊 DAILY STANDUP — Feb 5, 2026

✅ COMPLETED TODAY
• Kira: Competitor research for comparison page
• Mu: Dashboard mockup v1

🔄 IN PROGRESS  
• Sashi: Mission Control PRD
• Mu: Implementing dashboard changes

🚫 BLOCKED
• (none)

👀 NEEDS REVIEW
• Mu's dashboard mockup

📝 KEY ACTIVITY
• 12 comments across 4 tasks
• 2 new tasks created
```

### Deliverables
- [ ] Create standup aggregation script
- [ ] Set up cron job
- [ ] Format and send to Slack

---

## Migration Path

### From Queue to Mission Control
1. Queue data (status updates) → migrate to activity_feed
2. `/queue` URL → redirect to `/mission-control`
3. Status API → extend to support agent status

---

## Success Metrics
- Agents successfully wake on heartbeat and check tasks
- @mentions deliver within 5 minutes
- Activity feed shows real-time collaboration
- Daily standups provide useful summaries

---

## Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Schema & API | 1 day | — |
| Phase 2: Mission Control UI | 2 days | Phase 1 |
| Phase 3: Comments & @Mentions | 1 day | Phase 1 |
| Phase 4: Agent Config | 1 day | — |
| Phase 5: Notifications | 0.5 day | Phase 1, 3, 4 |
| Phase 6: Daily Standup | 0.5 day | Phase 1 |

**Total: ~6 days**

---

## Key Learnings from @pbteja1998 Video Interview

### Architecture Patterns
1. **Single point of contact** — Only talk to Sashi, who delegates to others
2. **Specialist focus** — Each agent does ONE thing well (not generalists)
3. **Spontaneous collaboration** — Agents join tasks when they can add value (e.g., Vision saw Shuri's research and added SEO data unprompted)
4. **Deliverables required** — Every task must have a document/output to be marked done
5. **Dashboard built by agents** — He asked Jarvis to build Mission Control, and Jarvis coded it

### What Works
- 15-minute heartbeat polling is the right cadence
- Giving agents access to analytics lets them diagnose problems
- Agents creating their own tasks based on insights they find
- "Office chat" for non-task discussions between agents

### The New Bottleneck
> "Previously the bottleneck was execution. Now every task is very good. The bottleneck is prioritization — figuring out which of 97 items to do first."

This means we should consider:
- Priority scoring on tasks
- Sashi helping with prioritization decisions
- Impact/effort estimation from agents

---

## Open Questions
1. Should agents share the same workspace (collaborative) or have isolated workspaces?
   - **Recommendation:** Isolated workspaces, shared via Mission Control database
2. Model costs — should heartbeats use a cheaper model?
   - **Recommendation:** Yes, use Sonnet for agents, reserve Opus for Sashi
3. How do agents access sashi-ui data?
   - **Recommendation:** API calls to sashi-ui.vercel.app/api/*
4. Should we add "Office Chat" for non-task agent discussions?
   - **Recommendation:** Phase 2 — start with task comments first

---

## References
- [Original Mission Control post](https://x.com/pbteja1998/status/2017662163540971756)
- [Clawdbot agents docs](https://docs.clawd.bot/cli/agents)
- [Clawdbot sessions docs](https://docs.clawd.bot/cli/sessions)
