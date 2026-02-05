# Mac Desktop App Feature Reference

## Overview

The Mac desktop app is built with Tauri, providing a native macOS experience with offline support, system integration (menus, tray, shortcuts), and automatic updates. It runs the same React frontend but with local SQLite for offline-first workflows.

## Key Files

| File | Purpose |
|------|---------|
| [src-tauri/](../../src-tauri/) | Tauri Rust backend |
| [src-tauri/src/main.rs](../../src-tauri/src/main.rs) | App entry point |
| [src-tauri/src/lib.rs](../../src-tauri/src/lib.rs) | Rust library |
| [src-tauri/tauri.conf.json](../../src-tauri/tauri.conf.json) | Tauri configuration |
| [src/components/SyncIndicator.tsx](../../src/components/SyncIndicator.tsx) | Sync status UI |
| [src/components/UpdateChecker.tsx](../../src/components/UpdateChecker.tsx) | Auto-update UI |
| [src/components/TauriEventListener.tsx](../../src/components/TauriEventListener.tsx) | Native events |
| [src/lib/offline/](../../src/lib/offline/) | Offline sync engine |

## Architecture

```
┌─────────────────────────────────────┐
│           Tauri Window              │
│  ┌───────────────────────────────┐  │
│  │       React Frontend          │  │
│  │  (Same as web, with hooks)    │  │
│  └───────────────────────────────┘  │
│                 │                   │
│                 ▼                   │
│  ┌───────────────────────────────┐  │
│  │      Tauri APIs (JS)          │  │
│  │  - @tauri-apps/api            │  │
│  │  - @tauri-apps/plugin-sql     │  │
│  │  - @tauri-apps/plugin-updater │  │
│  └───────────────────────────────┘  │
│                 │                   │
│                 ▼                   │
│  ┌───────────────────────────────┐  │
│  │      Rust Backend             │  │
│  │  - Native menus               │  │
│  │  - System tray                │  │
│  │  - Global shortcuts           │  │
│  │  - SQLite database            │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Key Features

### System Integration
- **Native window chrome** - macOS traffic lights
- **Menu bar** - File, Edit, View, Window menus
- **System tray** - Quick access icon with dropdown
- **Global shortcuts** - Work even when app not focused
  - `Cmd+K` - Quick add task
  - `Cmd+Shift+S` - Open Sashi

### Offline Support
- **Local SQLite** - via `@tauri-apps/plugin-sql`
- **Background sync** - Every 5 minutes
- **Conflict resolution** - Server wins for simplicity
- **Sync indicator** - Shows sync status

### Auto-Updates
- **UpdateChecker component** - Checks for new versions
- **`@tauri-apps/plugin-updater`** - Download and install
- **DMG packaging** - For macOS distribution

## Offline Sync Engine

```typescript
// src/lib/offline/sync.ts

// Sync strategy: periodic background sync
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function sync() {
  // 1. Get local changes since last sync
  const localChanges = await getLocalChanges();

  // 2. Push to server
  await pushChanges(localChanges);

  // 3. Pull server changes
  const serverChanges = await pullChanges(lastSyncTime);

  // 4. Apply to local database
  await applyChanges(serverChanges);

  // 5. Update last sync time
  await setLastSyncTime(Date.now());
}

// Start background sync
setInterval(sync, SYNC_INTERVAL);
```

## Development

```bash
# Start development (web + Tauri)
npm run tauri:dev

# Build for production
npm run tauri:build

# Static build (for offline-only)
npm run build:static
```

## Configuration

### tauri.conf.json

```json
{
  "productName": "Sashi",
  "version": "0.1.1",
  "identifier": "com.sashi.app",
  "build": {
    "frontendDist": "../out"
  },
  "app": {
    "windows": [{
      "title": "Sashi",
      "width": 1200,
      "height": 800,
      "resizable": true,
      "fullscreen": false
    }]
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "app"],
    "icon": ["icons/icon.icns"]
  }
}
```

## Plugins Used

| Plugin | Purpose |
|--------|---------|
| `@tauri-apps/plugin-sql` | Local SQLite database |
| `@tauri-apps/plugin-process` | Process management |
| `@tauri-apps/plugin-updater` | Auto-updates |

## Detecting Tauri Environment

```typescript
// Check if running in Tauri
const isTauri = typeof window !== 'undefined' &&
  window.__TAURI__ !== undefined;

// Conditional API usage
if (isTauri) {
  // Use local SQLite
  const db = await Database.load('sqlite:sashi.db');
} else {
  // Use remote API
  const response = await fetch('/api/tasks');
}
```

## Related Components

- `OfflineProvider.tsx` - Wraps app for offline support
- `AppLayout.tsx` - Includes Tauri-specific UI elements

## Related PRDs

- [PRD-mac-app](../PRD-mac-app.md) - Comprehensive specification
