# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:
- Camera names and locations
- SSH hosts and aliases  
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras
- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH
- home-server → 192.168.1.100, user: admin

### TTS
- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## Email

- **Freelance inbox:** lawrencep.design@gmail.com
- **Credentials:** `~/.config/gmail/lawrencep.design.json`
- **Access:** Read-only via IMAP
- **Inbox size:** ~45K messages
- **Ignore list:** Sam Lotfi (sam.lotfi@toptal.com)

---

## Notion

- **API key location:** `~/.config/notion/api_key`
- **Tasks database:** `03720dbd-bbf8-4f75-9f64-520e3da0d167` (data_source_id)
  - Properties: Task name (title), Status, Due, Priority, Assignee, Project, etc.

---

## Second Brain (#sb-inbox)

**Channel:** #sb-inbox (Slack) — Paul's capture point for thoughts
**Storage:** `~/clawd/brain/`

### Classification

When a message comes into #sb-inbox (not a command), classify and file:

| Type | Folder | When to use |
|------|--------|-------------|
| Person | `brain/people/` | Someone's name + context about them |
| Project | `brain/projects/` | Active work with defined outcome |
| Idea | `brain/ideas/` | Concept to explore later, no deadline |
| Admin | `brain/admin/` | One-off task or errand |
| Link | `brain/links/` | Bare URL with no context (bookmark/reference) |

**Link routing (hybrid):**
- Bare link with no comment → `brain/links/` (auto-fetch title + summary)
- Link with context → route by intent (e.g., "check this for Superlandings" → Projects)

### File Naming
- Lowercase, hyphenated: `sarah-chen.md`, `superlandings-redesign.md`
- Admin tasks: `YYYY-MM-DD-task-name.md` (if due date exists)

### Frontmatter Schema

```yaml
# Person
type: person
created: YYYY-MM-DD
updated: YYYY-MM-DD
last_contact: YYYY-MM-DD  # optional
follow_up: null           # optional - next action
tags: []

# Project
type: project
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active            # active | waiting | blocked | someday | done
next_action: null         # specific next step
tags: []

# Idea
type: idea
created: YYYY-MM-DD
updated: YYYY-MM-DD
one_liner: ""             # single sentence summary
tags: []

# Admin
type: admin
created: YYYY-MM-DD
updated: YYYY-MM-DD
due: null                 # YYYY-MM-DD if applicable
status: todo              # todo | done
tags: []

# Link
type: link
created: YYYY-MM-DD
updated: YYYY-MM-DD
url: ""                   # original URL
title: ""                 # fetched page title
category: null            # article | inspo | tool | resource | video
tags: []
```

### Commands
- `fix: [correction]` → Update last filed item
- `find: [query]` → Search brain and return matches
- `digest` → Generate on-demand summary

### Workflow
1. Receive message in #sb-inbox
2. Classify → extract type, name, details, confidence
3. Create/update file in appropriate folder
4. Append to `brain/inbox-log.md`
5. Reply with confirmation: "Filed to [type]: [filename]"
6. If confidence < 0.6, ask for clarification instead of filing

---

---

## Remotion (Video Creation)

- **Project location:** `~/clawd/remotion/my-video/`
- **Start preview:** `npm run dev` (opens Remotion Studio)
- **Render:** `npx remotion render [CompositionId] [output.mp4]`

### Templates Available:
- `SocialPost-Square` (1080x1080) - Instagram feed
- `SocialPost-Vertical` (1080x1920) - Reels/TikTok
- `SocialPost-Horizontal` (1280x720) - Twitter/LinkedIn
- `DesignShowcase-Desktop` (1920x1080) - Design presentations
- `DesignShowcase-Square` (1080x1080) - Square design showcase

### Asset workflow:
1. Export from Figma → drop in `public/` folder
2. Reference with `staticFile('filename.png')`
3. Create composition in `src/compositions/`
4. Register in `src/Root.tsx`

---

---

## Browser Testing (Playwright)

**Location:** `/tmp/` (Playwright installed locally)
**Browser:** Chromium (headless)

### Test Before Deploy Rule
Before deploying any UI changes to production, **always** run a Playwright test:

```javascript
// Quick test script
cd /tmp && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  // Capture errors
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto('https://sashi-ui.vercel.app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/test-screenshot.png', fullPage: true });
  
  console.log('Errors:', errors.length ? errors.join('\\n') : 'None');
  await browser.close();
})();
"
```

### What to Check
1. **No page errors** — React hydration, runtime exceptions
2. **Visual rendering** — Screenshot looks correct
3. **Key interactions** — Test drag/drop, clicks if relevant

### After Deploy Checklist
- [ ] Run Playwright test
- [ ] Check screenshot renders correctly  
- [ ] Verify no console errors
- [ ] Test on target page (dashboard, calendar, etc.)

---

Add whatever helps you do your job. This is your cheat sheet.
