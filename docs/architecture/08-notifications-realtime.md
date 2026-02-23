# 8. Notifications & Realtime

> Sections 12, 13 of the architecture doc.

---

## Notifications

### notifications table

```sql
notifications
  id              UUID PK
  userId          UUID FK → users       -- recipient
  type            VARCHAR(50) NOT NULL
  title           VARCHAR(200)
  body            TEXT
  data            JSONB                  -- structured payload for deep linking
  read            BOOLEAN DEFAULT false
  readAt          TIMESTAMP?
  createdAt       TIMESTAMP
  INDEX(userId, read, createdAt DESC)
```

### Notification Types

| Type | Trigger | data payload |
|------|---------|-------------|
| `PARTNER_REQUEST` | Partner link initiated | `{ partnerLinkId }` |
| `PARTNER_ACCEPTED` | Partner accepted | `{ partnerLinkId }` |
| `PARTNER_REVOKED` | Partner revoked link | `{ partnerLinkId }` |
| `CIRCLE_INVITED` | Invited to circle | `{ circleId, inviteId }` |
| `CIRCLE_JOIN_REQUEST` | Someone requests to join your circle | `{ circleId, requestId }` |
| `CIRCLE_APPROVED` | Your join request approved | `{ circleId }` |
| `CIRCLE_REJECTED` | Your join request rejected | `{ circleId }` |
| `CIRCLE_REMOVED` | You were removed from a circle | `{ circleId }` |
| `COMMENT_ADDED` | Comment on your entry | `{ entryId, commentId }` |
| `REACTION_ADDED` | Reaction on your entry | `{ entryId, reactionId }` |
| `ACCOUNT_DELETE_SCHEDULED` | Account deletion countdown started | `{ deleteAt }` |
| `ACCOUNT_DELETE_CANCELLED` | Account deletion cancelled | `{}` |

### Push Notifications

```
┌───────────┐    create notification     ┌──────────────┐
│ API event │ ─────────────────────────→ │ notifications │ (DB)
└─────┬─────┘                            └──────────────┘
      │
      │  async (don't block request)
      ▼
┌─────────────┐   APNs / FCM    ┌──────────┐
│ Push worker │ ───────────────→ │  Device  │
│ (BullMQ)   │                  └──────────┘
└─────────────┘
  reads from Redis queue
  looks up device tokens from push_tokens table
```

**push_tokens table:**
```sql
push_tokens
  id          UUID PK
  userId      UUID FK → users
  token       TEXT NOT NULL
  platform    ENUM('ios','android','web')
  createdAt   TIMESTAMP
  updatedAt   TIMESTAMP          -- track last refresh
  UNIQUE(userId, token)
```

**Push token lifecycle & cleanup:**

```
Registration:
  App start → getToken() → POST /v1/push-tokens { token, platform }
  Server: UPSERT (update updatedAt if exists, insert if new)

Refresh:
  When OS rotates token → same POST endpoint, old token auto-replaced

Cleanup (background job, runs daily):
  1. APNs/FCM returns 410 Gone or "NotRegistered" → DELETE token immediately
  2. Tokens with updatedAt > 90 days ago → DELETE (device likely uninstalled)
  3. On user logout → DELETE all tokens for that device

Deduplication:
  Same physical device, same user → one token row
  Same user, multiple devices → multiple token rows (expected)
```

### Notification API Routes

```
GET    /v1/notifications?cursor=xxx&limit=20
PATCH  /v1/notifications/:id/read
POST   /v1/notifications/read-all
GET    /v1/notifications/unread-count
POST   /v1/push-tokens               { token, platform }
DELETE /v1/push-tokens/:id              (by table UUID, not raw token — tokens in URLs leak to logs)
```

---

## Realtime — WebSocket

### Why

Polling `GET /notifications/unread-count` wastes bandwidth and battery. Several features need realtime updates:
- New comment/reaction on an entry the user is currently viewing
- Partner link request/response
- Circle approval progress
- Notification badge count

### Architecture

```
┌──────────┐  ws://api.innera.app/v1/ws  ┌──────────────────┐
│  Client  │ ◄──────────────────────────→ │  Fastify WS      │
│  (RN/Web)│                              │  (@fastify/ws)    │
└──────────┘                              └───────┬──────────┘
                                                  │
                                          ┌───────▼──────────┐
                                          │  Redis Pub/Sub   │
                                          │  channel per user │
                                          └──────────────────┘
                                                  ▲
                                          ┌───────┴──────────┐
                                          │  API workers      │
                                          │  (on event, pub)  │
                                          └──────────────────┘
```

### Connection Lifecycle — First-Message Auth

> **V3 optimization:** Auth via first message instead of query param JWT. Query param tokens appear in server logs and proxy access logs, creating a security risk.

```typescript
// Client connects WITHOUT token in URL:
ws://api.innera.app/v1/ws

// Server:
1. Accept connection, start 5-second auth timeout
2. Wait for first message: { type: 'auth', token: '<accessToken>' }
3. Validate JWT from the message payload
4. If valid → subscribe to Redis channel `ws:user:{userId}`, send { type: 'auth_ok' }
5. If invalid or timeout → close connection with code 4001
6. On message from Redis → forward to WS client
7. On WS close → unsubscribe from Redis channel

// Heartbeat: server sends ping every 30s, client must pong within 10s
// Reconnection: client auto-reconnects with exponential backoff (1s, 2s, 4s, max 30s)

// Session validation: every 5 min, server checks if userId still has valid
// refresh tokens in Redis. If not (e.g., user did logout-all), close WS
// with code 4002 (SESSION_REVOKED). This prevents a revoked session from
// continuing to receive realtime events.
```

### Event Types (server → client)

```typescript
type WsEvent =
  | { type: 'auth_ok' }
  | { type: 'notification'; payload: Notification }
  | { type: 'unread_count'; payload: { count: number } }
  | { type: 'comment_added'; payload: { entryId: string; comment: Comment } }
  | { type: 'reaction_added'; payload: { entryId: string; reaction: Reaction } }
  | { type: 'partner_status'; payload: { status: PartnerLinkStatus } }
  | { type: 'circle_approval_update'; payload: { requestId: string; currentCount: number; requiredCount: number } }
  | { type: 'pong' }  // heartbeat response
```

### Publishing Events

When an API handler creates a notification or event:

```typescript
// In the API handler (e.g., after creating a comment)
await redis.publish(`ws:user:${targetUserId}`, JSON.stringify({
  type: 'comment_added',
  payload: { entryId, comment }
}));
```

### Fallback

If WebSocket is unavailable (corporate proxies, etc.), the client falls back to polling:
- `GET /v1/notifications/unread-count` every 30 seconds
- Not ideal but functional

---

## Notification Cleanup

Background job (runs daily): delete notifications older than 90 days. This prevents unbounded table growth for active users.

```sql
DELETE FROM notifications WHERE createdAt < now() - INTERVAL '90 days';
```
