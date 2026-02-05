# Mission Control Feature Reference

## Overview

Mission Control is the multi-agent collaboration system that enables AI agents (Sashi, Kira, Mu) to work together on tasks. It provides task comments with @mentions, an activity feed, notifications, and agent status tracking. Currently in Phase 1 (schema and API complete).

## Key Files

| File | Purpose |
|------|---------|
| [src/lib/db/schema.ts](../../src/lib/db/schema.ts) | Agent tables (lines 270-407) |
| [src/app/api/agents/route.ts](../../src/app/api/agents/route.ts) | Agent list/update API |
| [src/app/api/agents/[id]/route.ts](../../src/app/api/agents/[id]/route.ts) | Single agent API |
| [src/app/api/agents/seed/route.ts](../../src/app/api/agents/seed/route.ts) | Initialize agents |
| [src/app/api/tasks/[id]/comments/route.ts](../../src/app/api/tasks/[id]/comments/route.ts) | Task comments API |
| [src/app/api/activity/route.ts](../../src/app/api/activity/route.ts) | Activity feed API |
| [src/app/api/notifications/route.ts](../../src/app/api/notifications/route.ts) | Notifications API |

## Database Schema

### Agents

```sql
agents (
  id TEXT PRIMARY KEY,           -- 'sashi', 'kira', 'mu'
  name TEXT NOT NULL,            -- Display name
  role TEXT NOT NULL,            -- 'Squad Lead', 'Researcher', 'Designer'
  description TEXT,              -- Capabilities description
  avatar TEXT,                   -- Emoji or image URL
  status TEXT DEFAULT 'idle',    -- idle | active | blocked
  session_key TEXT NOT NULL,     -- 'agent:kira:main'
  model TEXT,                    -- 'anthropic/claude-sonnet-4-20250514'
  current_task_id TEXT REFERENCES tasks(id),
  last_active_at INTEGER,
  created_at INTEGER NOT NULL
)
```

### Task Comments

```sql
task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  content TEXT NOT NULL,         -- Supports @mentions
  attachments TEXT,              -- JSON array of file refs
  created_at INTEGER NOT NULL
)
```

### Activity Feed

```sql
activity_feed (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,            -- See types below
  agent_id TEXT REFERENCES agents(id),
  task_id TEXT REFERENCES tasks(id),
  message TEXT NOT NULL,         -- Human-readable
  metadata TEXT,                 -- JSON extra context
  created_at INTEGER NOT NULL
)
```

Activity types:
- `task_created`
- `task_updated`
- `comment_added`
- `agent_status_changed`
- `task_assigned`

### Notifications

```sql
notifications (
  id TEXT PRIMARY KEY,
  mentioned_agent_id TEXT NOT NULL REFERENCES agents(id),
  from_agent_id TEXT REFERENCES agents(id),
  task_id TEXT REFERENCES tasks(id),
  comment_id TEXT REFERENCES task_comments(id),
  content TEXT NOT NULL,
  delivered INTEGER DEFAULT 0,
  read INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
)
```

### Task Subscriptions

```sql
task_subscriptions (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List all agents |
| `/api/agents/:id` | PATCH | Update agent status |
| `/api/agents/seed` | POST | Initialize default agents |
| `/api/tasks/:id/comments` | GET | Get task comments |
| `/api/tasks/:id/comments` | POST | Add comment |
| `/api/activity` | GET | Get activity feed |
| `/api/activity` | POST | Log activity |
| `/api/notifications` | GET | Get notifications |
| `/api/notifications/:id` | PATCH | Mark as read |

## The Squad

| Agent | ID | Role | Model | Avatar |
|-------|-------|------|-------|--------|
| Sashi | `sashi` | Squad Lead | Opus | ⚡ |
| Kira | `kira` | Researcher | Sonnet | 🔍 |
| Mu | `mu` | Designer | Sonnet | 🎨 |

## @Mention Parsing

Comments support @mentions that create notifications:

```typescript
// Parse @mentions from comment content
function parseMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.matchAll(mentionRegex);
  return Array.from(matches, m => m[1]);
}

// Example: "@kira can you research this?"
// Returns: ['kira']
```

## Seeding Agents

```bash
# Initialize the three default agents
POST /api/agents/seed
```

Response:
```json
{
  "agents": [
    { "id": "sashi", "name": "Sashi", "role": "Squad Lead" },
    { "id": "kira", "name": "Kira", "role": "Researcher" },
    { "id": "mu", "name": "Mu", "role": "Designer" }
  ]
}
```

## Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Database schema & API | Done |
| 2 | Mission Control UI | Not started |
| 3 | Task comments & @mentions UI | Not started |
| 4 | Agent configuration panel | Not started |
| 5 | Notification delivery | Not started |
| 6 | Daily standup feature | Not started |

## Planned Features (Phase 2+)

### Mission Control UI
- Agent status cards
- Activity feed timeline
- Task assignment interface

### Task Comments UI
- Threaded discussions
- @mention autocomplete
- Attachment support

### Agent Configuration
- Edit agent details
- Set preferred model
- Configure capabilities

### Notification Delivery
- Real-time delivery to agents
- Mention alerts
- Task update notifications

### Daily Standup
- Automated daily summary
- Task progress reports
- Blocker identification

## Related PRDs

- [PRD-mission-control](../PRD-mission-control.md) - Comprehensive specification
