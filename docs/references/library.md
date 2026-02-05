# Library Feature Reference

## Overview

The Library is a documentation and skills hub that provides access to PRDs (Product Requirement Documents), AI skills (CAST spells), and generated reports. It replaces the previous Skills page with a more comprehensive resource browser.

## Key Files

| File | Purpose |
|------|---------|
| [src/app/library/page.tsx](../../src/app/library/page.tsx) | Library page server component |
| [src/app/library/LibraryPageClient.tsx](../../src/app/library/LibraryPageClient.tsx) | Library client component |
| [src/components/SkillsManager.tsx](../../src/components/SkillsManager.tsx) | Skills display |
| [src/app/api/reports/route.ts](../../src/app/api/reports/route.ts) | Reports API |

## Tabs

The Library is organized into three tabs:

### 1. PRDs Tab
Browse product requirement documents from the `/docs` folder.

**Features:**
- Lists all PRD-*.md files
- Shows status (draft, in_progress, built)
- Expandable preview
- Status detection from file content

**Status Detection:**
```typescript
function detectStatus(content: string): 'draft' | 'in_progress' | 'built' {
  if (content.includes('✅') || content.includes('COMPLETE')) {
    return 'built';
  }
  if (content.includes('IN PROGRESS') || content.includes('🔄')) {
    return 'in_progress';
  }
  return 'draft';
}
```

### 2. Skills Tab
Browse AI skills and CAST spells.

**CAST Spells:**
- Reusable skill patterns
- Click-to-copy triggers
- Detail modal with full description
- Organized by category

**Features:**
- Hover copy button
- Skill detail modal
- Category filtering
- Search functionality

### 3. Reports Tab
Browse AI-generated reports.

**Report Types:**
- `morning` - Daily planning summary
- `nightly` - End-of-day review

**Database Schema:**
```sql
reports (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,      -- 'morning' | 'nightly'
  date TEXT NOT NULL,      -- YYYY-MM-DD
  title TEXT NOT NULL,
  content TEXT NOT NULL,   -- Markdown
  metadata TEXT,           -- JSON (task counts, highlights)
  created_at INTEGER NOT NULL
)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports` | GET | List reports |
| `/api/reports` | POST | Create report |
| `/api/reports/:id` | GET | Get single report |
| `/api/reports/:id` | DELETE | Delete report |

## Key Features

### PRD Browser
- **File listing** - Reads from `/docs/PRD-*.md`
- **Status badges** - Visual status indicators
- **Preview** - Expandable content preview
- **Full view** - Link to full document

### Skills Manager
- **CAST Library** - Curated skill collection
- **Copy trigger** - One-click copy for skill invocation
- **Detail modal** - Full skill description and examples
- **Categories** - Organized groupings

### Reports
- **Timeline view** - Chronological report list
- **Markdown rendering** - Rich content display
- **Metadata** - Task counts, highlights

## Configuration Files

The Library also loads configuration files from the project root:

| File | Purpose |
|------|---------|
| `AGENTS.md` | Agent configuration |
| `SOUL.md` | Project identity |
| `USER.md` | User profile |
| `TOOLS.md` | Available tools |
| `HEARTBEAT.md` | Heartbeat configuration |

## Static Export Note

The Library has limited functionality in static exports (Tauri builds):

```typescript
// Check for static mode
const isStatic = process.env.NEXT_PUBLIC_API_URL !== undefined;

if (isStatic) {
  // Disable PRD browser (no file system access)
  // Disable reports (no API)
  // Skills still work (embedded data)
}
```

## Related Components

- `RichEditor.tsx` - Markdown editing for PRDs
- `PRDCreator.tsx` - AI PRD generation

## Related PRDs

- [PRD-library](../PRD-library.md) - Library specification
- [PRD-ai-prd-workflow](../PRD-ai-prd-workflow.md) - PRD generation
