# 11. P0 Must-Haves

> Section 16 of the architecture doc.

---

## 1) Validation + Consistent Errors

- zod validation on ALL routes (request body, params, query).
- Centralized `AppError` model:

```typescript
class AppError extends Error {
  constructor(
    public code: string,          // e.g. 'ENTRY_NOT_FOUND'
    public statusCode: number,    // e.g. 404
    public message: string,
    public details?: unknown,
  ) { super(message); }
}
```

- Fastify `setErrorHandler`:

```typescript
app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }
  if (error.validation) {
    return reply.status(400).send({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      details: error.validation,
    });
  }
  request.log.error(error);
  reply.status(500).send({ code: 'INTERNAL_ERROR', message: 'Something went wrong' });
});
```

## 2) Rate Limiting + Invite Abuse

- `@fastify/rate-limit` backed by **Redis** (not in-memory) for multi-instance support.
- `/v1/auth/*` — 10 req/min per IP.
- `/v1/circles/*/invite` — 20 req/hour per userId.
- `/v1/export/*` — 3 req/hour per userId.
- `/v1/import/*` — 3 req/day per userId.
- `/v1/account/delete` — 1 req/hour per userId.
- `/v1/partner/respond` — 10 req/min per userId.
- `GET /v1/entries/search` — 30 req/min per userId (expensive server-side decryption).
- `POST /v1/entries` — 60 req/min per userId.
- `POST /v1/entries/:entryId/comments` — 30 req/min per userId.
- `POST /v1/entries/:entryId/reactions` — 30 req/min per userId.
- **Global fallback:** 300 req/min per userId across all authenticated endpoints.
- Invite table with `expiresAt`, `maxUses`, `usedCount`; transactional consume with row lock.

## 3) Audit Log

```sql
audit_events
  id          UUID PK
  userId      UUID FK → users
  action      VARCHAR(100)
  targetType  VARCHAR(50)
  targetId    UUID
  metadata    JSONB
  ipAddress   INET
  requestId   UUID
  createdAt   TIMESTAMP
  INDEX(userId, createdAt DESC)
  INDEX(targetType, targetId)
```

**Audited actions:** partner link/unlink, circle invite/join/approve/reject/leave/remove, entry visibility change, entry delete, export, import, account link/unlink, account delete, logout-all.

## 4) Data Lifecycle

- Soft delete entries: `deletedAt TIMESTAMP`.
- Default queries: `WHERE deletedAt IS NULL`.
- Hard delete after 30 days (background job).
- User can restore within 30-day window via `POST /v1/entries/:id/restore`.

## 5) API Idempotency

Mobile clients on unreliable networks may retry requests. Write operations MUST support idempotency to prevent duplicates.

**Mechanism:**

```
Client sends:  POST /v1/entries  with header Idempotency-Key: <client-generated UUID>

Server flow:
1. Check Redis: GET idempotency:{userId}:{key}
2. If exists → return cached response (same status code + body)
3. If not → acquire lock: SET idempotency:{userId}:{key}:lock NX EX 30
4. If lock acquired → process request normally
5. If lock NOT acquired → return 409 (concurrent duplicate in flight)
6. After processing → store result: SET idempotency:{userId}:{key} → { statusCode, body } EX 86400 (24h TTL)
7. Release lock: DEL idempotency:{userId}:{key}:lock
```

**Which endpoints require idempotency:**

| Endpoint | Why |
|----------|-----|
| `POST /v1/entries` | Prevent duplicate entries on retry |
| `POST /v1/partner/request` | Prevent duplicate partner requests |
| `POST /v1/circles/:id/join` | Prevent duplicate join requests |
| `POST /v1/circles/:id/approve/:requestId` | Prevent double-counting approvals |
| `POST /v1/entries/:entryId/comments` | Prevent duplicate comments |
| `POST /v1/import/*` | Prevent duplicate import jobs |

**Implementation as Fastify plugin:**

> **V3 optimization:** Uses `onSend` hook instead of `reply.then()` (which is not a standard Fastify API). Added Redis `SET NX` lock to prevent thundering herd — when multiple identical requests arrive simultaneously, only one processes while others get a 409.

```typescript
// plugins/idempotency.ts
app.addHook('preHandler', async (request, reply) => {
  const key = request.headers['idempotency-key'];
  if (!key || request.method === 'GET') return;

  const cacheKey = `idempotency:${request.user?.id}:${key}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    const { statusCode, body } = JSON.parse(cached);
    reply.status(statusCode).send(body);
    return reply; // short-circuit
  }

  // Acquire lock to prevent thundering herd
  const lockKey = `${cacheKey}:lock`;
  const lockAcquired = await redis.set(lockKey, '1', 'NX', 'EX', 30);

  if (!lockAcquired) {
    reply.status(409).send({
      code: 'IDEMPOTENCY_CONFLICT',
      message: 'A request with this idempotency key is already being processed',
    });
    return reply;
  }

  // Store lock key for cleanup in onSend
  request.idempotencyLockKey = lockKey;
  request.idempotencyCacheKey = cacheKey;
});

app.addHook('onSend', async (request, reply, payload) => {
  const cacheKey = request.idempotencyCacheKey;
  if (!cacheKey) return payload;

  // Only cache successful responses (2xx). Transient errors (5xx) should
  // NOT be cached — the client must be able to retry successfully.
  // Client errors (4xx) are cached since they will fail again with same input.
  if (reply.statusCode >= 200 && reply.statusCode < 500) {
    await redis.set(cacheKey, JSON.stringify({
      statusCode: reply.statusCode,
      body: payload,
    }), 'EX', 86400);
  }

  // Always release the lock
  if (request.idempotencyLockKey) {
    await redis.del(request.idempotencyLockKey);
  }

  return payload;
});
```
