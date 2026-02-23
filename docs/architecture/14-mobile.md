# 14. Mobile Architecture

> Section 19 of the architecture doc.

---

## Offline Support

```
┌──────────────────────────────────────────────────┐
│  Mobile App                                       │
│                                                   │
│  ┌─────────────┐     ┌──────────────────────┐    │
│  │  UI (React  │     │  Local SQLite (expo-  │    │
│  │  Native +   │◄───►│  sqlite) + MMKV      │    │
│  │  Tamagui)   │     │  (key-value cache)    │    │
│  └──────┬──────┘     └──────────┬───────────┘    │
│         │                       │                 │
│         │                       │ sync            │
│         │              ┌────────▼────────┐        │
│         │              │  Sync Engine    │        │
│         │              │  (background)   │        │
│         │              └────────┬────────┘        │
│         │                       │                 │
└─────────┼───────────────────────┼─────────────────┘
          │                       │
          │              ┌────────▼────────┐
          └─────────────►│  API Server     │
                         └─────────────────┘
```

**Local storage strategy:**

| Storage | Use |
|---------|-----|
| **expo-sqlite** | Full entry data (encrypted at rest via SQLCipher or app-level encryption), offline drafts, sync queue |
| **MMKV** | Auth tokens, user preferences, feature flags, small key-value data |
| **File system** | Cached attachment thumbnails |

## Sync Strategy with Version-Based Conflict Detection

> **V3 optimization:** Uses `version INT` column instead of `updatedAt` for conflict detection. Version numbers are monotonically increasing and immune to clock skew between client and server.

**Write-local-first:**
- New entries save to SQLite immediately, then queue for upload.
- Sync queue table in SQLite: `{ id, action, payload, status, retryCount, createdAt }`.
- Background sync: when network available, process queue FIFO with exponential backoff.

**Conflict detection (version-based):**

```
┌─────────────────────────────────────────────────────────────┐
│  Sync Conflict Resolution                                    │
│                                                              │
│  On push (upload local changes):                             │
│    1. Send entry with local version number                   │
│    2. Server compares:                                       │
│       local.version == server.version → clean merge ✓        │
│         → server increments version, saves, returns new ver  │
│       local.version < server.version  → CONFLICT ✗           │
│       local.version > server.version  → reject (invalid)     │
│                                                              │
│  On conflict:                                                │
│    1. Server returns 409 Conflict with server version        │
│    2. Client stores BOTH versions locally:                   │
│       - Original entry (server version)                      │
│       - Conflict fork (local version, conflictOf = entryId)  │
│    3. UI shows conflict resolution screen:                   │
│       ┌─────────────────────────────────────┐               │
│       │  Conflict Detected                  │               │
│       │                                      │               │
│       │  [Server Version]  [Your Version]    │               │
│       │  "Today I went..." "Today I went..." │               │
│       │    (diff highlighted)                │               │
│       │                                      │               │
│       │  [Keep Server] [Keep Mine] [Merge]   │               │
│       └─────────────────────────────────────┘               │
│                                                              │
│  "Merge" opens editor with both versions side-by-side.       │
│  After resolution → delete conflict fork, update entry,      │
│  server increments version.                                  │
│                                                              │
│  Unresolved conflicts are flagged with a badge in UI.        │
└─────────────────────────────────────────────────────────────┘
```

**Pull sync:** On app foreground, fetch entries updated since `lastSyncAt`. Use `INDEX(authorId, updatedAt)` for efficient sync queries.

## Push Notifications

| Platform | Service | Implementation |
|----------|---------|---------------|
| iOS | APNs | `expo-notifications` → register token → `POST /v1/push-tokens` |
| Android | FCM | Same flow via Expo |
| Web | Web Push | `web-push` library, service worker |

## Local Search (Offline)

When offline, search runs against local SQLite using FTS5:

```sql
CREATE VIRTUAL TABLE entries_fts USING fts5(content, entryId);
```

Populated during sync when entries are decrypted locally.
