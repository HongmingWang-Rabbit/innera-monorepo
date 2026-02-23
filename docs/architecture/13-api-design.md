# 13. API Design

> Section 18 of the architecture doc.

---

## Base URL & Versioning

All routes prefixed with `/v1`. Example: `https://api.innera.app/v1/auth/me`.

## CORS

```typescript
import cors from '@fastify/cors';

app.register(cors, {
  origin: [
    'https://innera.app',
    'https://www.innera.app',
    ...(isDev ? ['http://localhost:3000'] : []),
  ],
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Reauth-Token', 'Idempotency-Key'],
});
```

## Health Checks

```
GET /health          → { status: 'ok', timestamp }     (public, liveness probe)
GET /health/ready    → checks DB + Redis connectivity   (internal only or secret-gated)
                       { status: 'ok', db: 'connected', redis: 'connected' }
                       returns 503 if any dependency is down
```

**Security:** `/health/ready` exposes dependency status. In production, expose it only on an internal port (not public-facing), or gate it behind a shared secret header (`X-Health-Secret`). `/health` is safe to expose publicly.

## Pagination (Cursor-based)

All list endpoints use cursor-based pagination:

```typescript
// Request
GET /v1/entries?cursor=<base64-encoded-createdAt>&limit=20&direction=desc

// Response
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI1LTAxLTAxVDAwOjAwOjAwWiJ9",
    "hasMore": true,
    "limit": 20
  }
}
```

## File Storage (Attachments)

```
Upload flow:
1. Client → POST /v1/attachments/presign { entryId, fileName, mimeType }
2. Server → returns { uploadUrl, storageKey } (S3/R2 presigned PUT URL)
3. Client → PUT <uploadUrl> with file body (direct upload to storage)
4. Client → POST /v1/attachments/confirm { storageKey, entryId, sizeBytes }
5. Server → creates attachment row, validates

Download flow:
1. Client → GET /v1/attachments/:id/url
2. Server → checks permissions, returns { downloadUrl } (presigned GET, 15 min TTL)
```

**Storage backend:** Cloudflare R2 (S3-compatible, no egress fees) or AWS S3.
**Size limits:** 10MB per file, 50MB total per entry.
**Allowed types:** image/jpeg, image/png, image/webp, image/heic, video/mp4 (under 10MB).
**Content-type validation:** The presigned PUT URL includes a `Content-Type` condition matching the claimed `mimeType`. Additionally, the `/v1/attachments/confirm` step reads the first 16 bytes of the uploaded object (magic bytes / file signature) to verify the actual file type matches the claimed MIME type. Mismatches are rejected and the object is deleted from storage.

## Complete Route Map

```
Auth:           POST /v1/auth/google/code
                POST /v1/auth/apple/code
                POST /v1/auth/refresh
                GET  /v1/auth/me
                POST /v1/auth/logout
                POST /v1/auth/logout-all

Users:          PATCH /v1/users/me                   ← V3 addition
                  { displayName?, avatarUrl? }

Entries:        GET    /v1/entries
                POST   /v1/entries                    [idempotent]
                GET    /v1/entries/:id
                PATCH  /v1/entries/:id                 { version required; returns 409 on conflict }
                DELETE /v1/entries/:id                 (soft delete)
                POST   /v1/entries/:id/restore
                GET    /v1/entries/search?q=xxx

Partner:        POST   /v1/partner/request             [idempotent]
                POST   /v1/partner/respond              { accept: boolean }
                DELETE /v1/partner                      (revoke)
                GET    /v1/partner

Circles:        POST   /v1/circles
                GET    /v1/circles
                GET    /v1/circles/:id
                PATCH  /v1/circles/:id                  (name/description, admin only)
                POST   /v1/circles/:id/invite
                POST   /v1/circles/:id/join             [idempotent]
                POST   /v1/circles/:id/approve/:reqId   [idempotent]
                POST   /v1/circles/:id/reject/:reqId
                POST   /v1/circles/:id/leave
                DELETE /v1/circles/:id/members/:userId  (admin kick)
                POST   /v1/circles/:id/transfer-admin   { newAdminUserId }
                GET    /v1/circles/:id/members

Comments:       POST   /v1/entries/:entryId/comments    [idempotent]
                DELETE /v1/comments/:id

Reactions:      POST   /v1/entries/:entryId/reactions
                DELETE /v1/reactions/:id

Notifications:  GET    /v1/notifications
                PATCH  /v1/notifications/:id/read
                POST   /v1/notifications/read-all
                GET    /v1/notifications/unread-count

Push Tokens:    POST   /v1/push-tokens
                DELETE /v1/push-tokens/:id

Attachments:    POST   /v1/attachments/presign
                POST   /v1/attachments/confirm
                GET    /v1/attachments/:id/url

Export:         GET    /v1/export/json
                GET    /v1/export/markdown

Import:         POST   /v1/import/json                  [idempotent]
                POST   /v1/import/markdown               [idempotent]
                POST   /v1/import/dayone                 [idempotent]
                GET    /v1/import/jobs/:jobId

Account:        POST   /v1/account/delete
                POST   /v1/account/cancel-delete
                GET    /v1/account/deletion-status

Settings:       GET    /v1/settings
                PATCH  /v1/settings

WebSocket:      WS     /v1/ws                            (first-message auth)

Health:         GET    /health
                GET    /health/ready
```
