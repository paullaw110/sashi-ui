# Second Brain

Drop thoughts in #sb-inbox. I classify and file them here.

## Structure

```
brain/
├── people/       # Relationship context
├── projects/     # Active work with outcomes
├── ideas/        # Concepts to explore later
├── admin/        # One-off tasks and errands
├── links/        # Bookmarks and references (bare URLs)
└── inbox-log.md  # Audit trail of everything captured
```

## How It Works

1. **Capture** → Post to #sb-inbox (Slack)
2. **Classify** → I determine type + extract details
3. **File** → Create/update markdown file in the right folder
4. **Confirm** → Reply with what I filed and where
5. **Surface** → Daily/weekly digests (coming soon)

## File Format

Each file uses YAML frontmatter + markdown body:

```markdown
---
type: person
created: 2025-01-25
updated: 2025-01-25
tags: []
---

# Name

Content here...
```

## Commands

In #sb-inbox, you can also say:
- `fix: [correction]` — I'll update the last filed item
- `find: [query]` — I'll search and return matches
- `digest` — Get today's summary on demand
