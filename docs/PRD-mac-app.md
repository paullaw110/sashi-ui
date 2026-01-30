# PRD: Sashi UI Mac App

## Overview

Transform Sashi UI from a web application into a native macOS application, providing a faster, more integrated desktop experience with native OS features.

---

## Goals

1. **Native feel** — Feels like a first-class Mac citizen, not a wrapped website
2. **Performance** — Instant startup, no browser overhead
3. **Offline support** — Works without internet (syncs when connected)
4. **System integration** — Menu bar, notifications, keyboard shortcuts, Spotlight
5. **Always available** — Quick access from menu bar or global hotkey

---

## User Stories

### Core
- As a user, I want to launch Sashi instantly from my dock or menu bar
- As a user, I want to use Cmd+K to open quick add from anywhere on my Mac
- As a user, I want to see task notifications even when the app is in the background
- As a user, I want my tasks to sync automatically when I come back online

### Power User
- As a user, I want to use native keyboard shortcuts (Cmd+N, Cmd+,, etc.)
- As a user, I want the app to remember my window position and size
- As a user, I want to search tasks via Spotlight
- As a user, I want to right-click items for context menus

---

## Technical Approach Options

### Option A: Tauri (Recommended)
**What:** Lightweight framework using system WebView + Rust backend

| Pros | Cons |
|------|------|
| ~10MB app size (vs 150MB+ Electron) | Newer ecosystem |
| Uses native WebKit (Safari engine) | Less community resources |
| Fast startup, low memory | Learning Rust for native features |
| Can reuse 95% of React code | |
| Native menu bar, notifications | |

**Effort:** 2-3 weeks for MVP

### Option B: Electron
**What:** Chromium + Node.js wrapped in app bundle

| Pros | Cons |
|------|------|
| Mature ecosystem | 150MB+ app size |
| Easy to develop | High memory usage |
| Huge community | Feels like a browser |
| Same as VS Code, Slack, Discord | Slower startup |

**Effort:** 1-2 weeks for MVP

### Option C: Native Swift
**What:** True native macOS app with SwiftUI

| Pros | Cons |
|------|------|
| Best performance | Complete rewrite |
| Smallest app size | Can't reuse React code |
| True native UX | Mac-only (no Windows later) |
| Best OS integration | Longest development time |

**Effort:** 8-12 weeks for feature parity

### Option D: PWA (Progressive Web App)
**What:** Web app installed as standalone app

| Pros | Cons |
|------|------|
| Zero additional code | Limited native features |
| Auto-updates | No menu bar presence |
| Works today | No global shortcuts |
| Smallest effort | Browser-dependent |

**Effort:** 1 day (already mostly works)

---

## Recommendation: Tauri

Tauri provides the best balance of:
- **Native experience** without rewriting in Swift
- **Small footprint** (~10MB vs 150MB Electron)
- **Code reuse** — Our React app works directly
- **Future-proof** — Can add Windows/Linux later

---

## MVP Feature Set (v1.0)

### Must Have
- [ ] Dock icon with badge count (overdue tasks)
- [ ] Menu bar quick access
- [ ] Native window chrome (traffic lights, title bar)
- [ ] Cmd+K global hotkey for quick add
- [ ] Cmd+N new task
- [ ] Cmd+, preferences
- [ ] Local storage for offline viewing
- [ ] Auto-sync when online
- [ ] Native notifications for reminders

### Nice to Have (v1.1)
- [ ] Spotlight integration (search tasks)
- [ ] Touch Bar support
- [ ] Calendar.app integration
- [ ] Widgets for Notification Center
- [ ] Share extension (add tasks from any app)

### Future (v2.0)
- [ ] Apple Watch companion app
- [ ] Siri shortcuts ("Hey Siri, add a task")
- [ ] Focus mode integration
- [ ] Handoff between devices

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Tauri App                        │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │              React Frontend                  │   │
│  │         (Existing Sashi UI code)            │   │
│  └─────────────────────────────────────────────┘   │
│                        │                            │
│                   Tauri Bridge                      │
│                        │                            │
│  ┌─────────────────────────────────────────────┐   │
│  │              Rust Backend                    │   │
│  │  • Local SQLite cache                       │   │
│  │  • Background sync                          │   │
│  │  • System notifications                     │   │
│  │  • Global shortcuts                         │   │
│  │  • Menu bar                                 │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
                    HTTPS/WSS
                         │
                         ▼
              ┌──────────────────┐
              │   Turso Cloud    │
              │    (Existing)    │
              └──────────────────┘
```

---

## Implementation Plan

### Phase 1: Setup (Week 1)
- [ ] Initialize Tauri project
- [ ] Configure build for macOS
- [ ] Integrate existing React app
- [ ] Basic window management
- [ ] Code signing setup

### Phase 2: Native Features (Week 2)
- [ ] Menu bar icon + dropdown
- [ ] Native menus (File, Edit, View, etc.)
- [ ] Global keyboard shortcuts
- [ ] System notifications
- [ ] Dock badge

### Phase 3: Offline & Sync (Week 3)
- [ ] Local SQLite database
- [ ] Sync engine (conflict resolution)
- [ ] Background sync service
- [ ] Online/offline indicator

### Phase 4: Polish & Ship (Week 4)
- [ ] App icon design
- [ ] DMG installer design
- [ ] Auto-updater
- [ ] Crash reporting
- [ ] Beta testing
- [ ] App Store submission (optional)

---

## Distribution Options

### Direct Download (Recommended for MVP)
- Host DMG on website
- Sparkle for auto-updates
- Notarization for Gatekeeper

### Mac App Store
- Sandboxing restrictions
- 30% Apple cut
- Easier discovery
- Auto-updates handled by Apple

---

## Success Metrics

| Metric | Target |
|--------|--------|
| App size | < 20MB |
| Cold startup | < 1 second |
| Memory usage | < 100MB idle |
| Crash-free sessions | > 99.5% |
| Daily active users | Track vs web |

---

## Open Questions

1. **Pricing?** — Free, one-time purchase, or subscription?
2. **Web + Mac sync?** — Use same Turso DB or separate?
3. **Windows version?** — Plan for cross-platform now?
4. **Beta program?** — How to recruit testers?

---

## References

- [Tauri Documentation](https://tauri.app)
- [Tauri + Next.js Guide](https://tauri.app/v1/guides/getting-started/setup/next-js)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/macos)
- [Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
