# PRD: Icons & Emojis for Projects and Organizations

## Overview

Add visual icons (emojis or custom icons) to projects and organizations for quick visual identification. Like Notion's page icons or Slack's channel emojis.

---

## Goals

1. **Visual recognition** — Instantly identify projects/orgs without reading
2. **Personality** — Make the workspace feel personal and fun
3. **Hierarchy clarity** — Distinguish orgs from projects at a glance
4. **Flexibility** — Support both emoji and custom icon options

---

## User Stories

### Core
- As a user, I want to add an emoji to my organization (e.g., 🏢 Work, 🏠 Personal)
- As a user, I want to add an emoji to my project (e.g., 🚀 Launch, 🐛 Bugs)
- As a user, I want to see icons in dropdowns, breadcrumbs, and sidebars
- As a user, I want to change or remove an icon easily

### Discovery
- As a user, I want to browse emoji by category
- As a user, I want to search for emoji by name
- As a user, I want to see recently used emoji

---

## Data Model

### Schema Changes

```sql
-- Add icon column to organizations
ALTER TABLE organizations ADD COLUMN icon TEXT;  -- stores emoji or icon ID

-- Add icon column to projects  
ALTER TABLE projects ADD COLUMN icon TEXT;
```

### Icon Format
Store as plain emoji character or icon identifier:
- Emoji: `"🚀"`, `"📊"`, `"🎯"`
- Custom icon (future): `"icon:briefcase"`, `"icon:rocket"`

---

## UI Components

### 1. Icon Display
Shows icon wherever org/project appears.

**With icon:**
```
🏢 Acme Corp          🚀 Website Redesign
```

**Without icon (default):**
```
📁 Acme Corp          📄 Website Redesign
   ↑ gray folder         ↑ gray document
```

### 2. Icon Picker
Popover for selecting icons.

```
┌─────────────────────────────────────────┐
│ 🔍 Search emoji...                      │
├─────────────────────────────────────────┤
│ Recent                                  │
│ 🚀 📊 🎯 💼 🏠 ⭐                        │
├─────────────────────────────────────────┤
│ Smileys        Objects       Symbols    │
│ 😀 😃 😄       📱 💻 🖥️      ✅ ❌ ⚠️    │
│ 😁 😆 😅       📧 📨 📩      🔴 🟡 🟢    │
│ ...            ...           ...        │
├─────────────────────────────────────────┤
│ [Remove icon]                           │
└─────────────────────────────────────────┘
```

### 3. Integration Points

**Sidebar:**
```
┌──────────────────────┐
│ Organizations        │
│ 🏢 Acme Corp         │
│ 🏠 Personal          │
│ 💼 Freelance         │
├──────────────────────┤
│ Projects             │
│ 🚀 Website Redesign  │
│ 📊 Q1 Reports        │
│ 🎯 Marketing         │
└──────────────────────┘
```

**Task breadcrumb:**
```
🏢 Acme Corp / 🚀 Website Redesign / Fix header bug
```

**Dropdowns:**
```
┌─────────────────────────┐
│ Select Organization     │
├─────────────────────────┤
│ 🏢 Acme Corp            │
│ 🏠 Personal             │
│ 💼 Freelance            │
└─────────────────────────┘
```

**Organization cards:**
```
┌─────────────────────────────────────┐
│ 🏢                                  │
│ Acme Corp                           │
│ 12 projects · 45 tasks              │
└─────────────────────────────────────┘
```

---

## Interaction Patterns

### Setting an Icon
1. Click the icon area (or placeholder)
2. Emoji picker opens
3. Search or browse
4. Click to select
5. Picker closes, icon updates immediately

### Removing an Icon
1. Open emoji picker
2. Click "Remove icon" at bottom
3. Reverts to default placeholder

### Quick Access
- Recently used emoji shown at top
- Frequently used emoji bubbled up
- Search supports aliases ("rocket" → 🚀)

---

## Emoji Picker Library

**Recommended: emoji-mart**
- Popular React emoji picker
- Searchable with aliases
- Skin tone support
- Recent emoji tracking
- ~50KB gzipped

```bash
npm install @emoji-mart/react @emoji-mart/data
```

Alternative: Build minimal picker with curated set (~100 emoji)

---

## API Changes

### Organizations
```
PATCH /api/organizations/:id
Body: { icon: "🏢" }  // or { icon: null } to remove
```

### Projects
```
PATCH /api/projects/:id
Body: { icon: "🚀" }
```

No new endpoints needed — just add `icon` to existing PATCH handlers.

---

## Implementation Plan

### Phase 1: Schema & API (2 hours)
- [ ] Add `icon` column to organizations table
- [ ] Add `icon` column to projects table
- [ ] Update PATCH endpoints to handle icon
- [ ] Include icon in GET responses

### Phase 2: Display (2 hours)
- [ ] Create IconDisplay component
- [ ] Add to organization cards
- [ ] Add to project list
- [ ] Add to breadcrumbs
- [ ] Add to dropdown options
- [ ] Add to sidebar (if applicable)

### Phase 3: Picker (3 hours)
- [ ] Install emoji-mart
- [ ] Create EmojiPicker wrapper component
- [ ] Style to match dark theme
- [ ] Add recent emoji tracking
- [ ] Add remove option

### Phase 4: Integration (2 hours)
- [ ] Add picker to OrganizationModal
- [ ] Add picker to ProjectModal (or inline)
- [ ] Add inline editing in org/project lists
- [ ] Optimistic updates

### Phase 5: Polish (1 hour)
- [ ] Default icons for no-icon state
- [ ] Keyboard navigation in picker
- [ ] Animation on icon change
- [ ] Mobile-friendly picker

**Total: ~10 hours / 1.5 days**

---

## Default Icons

When no icon is set, show a muted default:

| Type | Default | Color |
|------|---------|-------|
| Organization | 🏢 or `Building2` icon | Gray/muted |
| Project | 📁 or `Folder` icon | Gray/muted |

Use Lucide icons as defaults, emoji when user sets one.

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Emoji not supported (old OS) | Show fallback character or hide |
| Very wide emoji (flags) | Constrain width, may crop |
| Skin tone variants | Support, store full sequence |
| Custom emoji (future) | Store as `icon:name`, resolve to image |
| Icon in exports/API | Return raw emoji string |

---

## Future Enhancements

- **Custom icons** — Upload or choose from icon library
- **Icon colors** — Tint monochrome icons
- **Auto-suggest** — Suggest icons based on name ("Marketing" → 📣)
- **Icon packs** — Premium icon sets
- **Animated icons** — Subtle animations on hover

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Orgs with custom icon | > 50% |
| Projects with custom icon | > 30% |
| Icon changes per user | Track engagement |
| Picker load time | < 200ms |

---

## Open Questions

1. **Sync across devices?** — Icons stored in DB, so yes
2. **Icon in notifications?** — Include in task reminders?
3. **API consumers?** — Return icon in API responses for integrations?
