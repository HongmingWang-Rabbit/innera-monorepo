# 17. Testing & CI

> Sections 23, 24 of the architecture doc.

---

## Unit Tests — `/packages/shared/test`

Vitest unit tests:

```
permissions.test.ts
  - PRIVATE entry visible only to author
  - PARTNER entry visible to linked partner
  - PARTNER entry NOT visible after partner revoke
  - CIRCLE entry visible to circle members
  - FUTURE_CIRCLE_ONLY entry NOT visible to members who joined before entry creation
  - FUTURE_CIRCLE_ONLY entry visible to members who joined after entry creation

circle-approval.test.ts
  - Unanimous approval state machine — all approve → APPROVED
  - Single reject → immediately REJECTED
  - Member leaves during voting → requiredCount recalculated
  - Expired request → EXPIRED status
  - Duplicate approval → error

circle-permissions.test.ts
  - Admin can kick member
  - Member cannot kick
  - Admin transfer succeeds
  - Last admin leave → auto-promote earliest member
  - Last person leave → circle archived

partner-links.test.ts
  - State transitions: PENDING → ACTIVE → REVOKED
  - Cannot have two active partner links
  - Expired pending link auto-transitions

encryption.test.ts
  - Encrypt/decrypt round-trip
  - Different users get different keys
  - Wrong key fails to decrypt
  - Key rotation: old version decrypts correctly, new version encrypts correctly

content-format.test.ts
  - Markdown strip produces clean plaintext for search
  - Sanitized HTML has no script tags
  - DOMPurify removes dangerous attributes
```

## API Integration Tests — `/apps/api/test`

Vitest + Fastify `inject()` (light-my-request):

```
auth.integration.test.ts
  - POST /v1/auth/google/code → returns tokens
  - POST /v1/auth/apple/code → returns tokens
  - POST /v1/auth/refresh → rotates refresh token
  - Invalid refresh token → 401
  - Logout deletes refresh token from Redis
  - Logout-all clears all sessions

entries.integration.test.ts
  - CRUD lifecycle with encryption
  - Soft delete excludes from list
  - Restore soft-deleted entry
  - Search returns decrypted matches
  - Search returns isComplete: false for partial scans
  - Idempotency-Key prevents duplicate creation

partner.integration.test.ts
  - Full partner flow: request → accept → revoke
  - Partner visibility entry access
  - Revoke cascades entry visibility to PRIVATE

circle.integration.test.ts
  - Circle creation + invite + join + approval
  - FUTURE_ONLY join gating
  - Admin kick removes member and recounts approvals
  - Last admin leave promotes earliest member
  - Invite flow → join request → approval flow

export-import.integration.test.ts
  - JSON export streams correctly
  - Rate limit enforced on export
  - JSON import creates entries
  - Import job status polling works

account.integration.test.ts
  - Delete request creates pending deletion
  - Cancel delete within cooling period works
  - Hard deletion anonymizes user data

idempotency.integration.test.ts
  - Duplicate POST with same Idempotency-Key returns cached response
  - Different key creates new resource
  - GET requests ignore Idempotency-Key

websocket.integration.test.ts
  - WS connection with valid JWT succeeds (first-message auth)
  - WS connection with expired JWT rejected
  - Published event reaches connected client
```

**Test database:** Separate Postgres database (`innera_test`), truncated between tests via `beforeEach`.

## DB Layer Tests — `/packages/db/test`

```
soft-delete.test.ts
  - Default query excludes soft-deleted rows
  - Include deleted flag returns all rows

invite-consume.test.ts
  - Transactional consume decrements usedCount
  - Expired invite cannot be consumed
  - maxUses enforced

encryption-fields.test.ts
  - contentEncrypted stored as bytea
  - No plaintext content in DB

connection-pool.test.ts
  - Pool respects max connections
  - Health check returns true when connected
  - Health check returns false when DB is down
```

## Web E2E — `/apps/web/e2e`

Playwright:

```
auth.spec.ts       (TEST_AUTH mode bypasses Google/Apple redirect)
entry-crud.spec.ts (create, edit, delete entry)
```

**TEST_AUTH guard:**
```typescript
// Only available when TEST_AUTH_ENABLED=true AND NODE_ENV !== 'production'
if (process.env.TEST_AUTH_ENABLED === 'true' && process.env.NODE_ENV !== 'production') {
  app.post('/v1/auth/test', async (request, reply) => { ... });
}
```

## Mobile E2E — `/apps/mobile/.maestro`

Maestro smoke test using TEST_AUTH mode.

---

## CI (GitHub Actions)

`.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: innera_test
          POSTGRES_USER: innera
          POSTGRES_PASSWORD: innera_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:generate
      - run: pnpm db:migrate
      - run: pnpm test:integration
        env:
          DATABASE_URL: postgres://innera:innera_test@localhost:5432/innera_test
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test
          JWT_SECRET: test-secret-min-32-chars-long-xxxxx
          MASTER_ENCRYPTION_KEY: 00000000000000000000000000000000

  build:
    runs-on: ubuntu-latest
    needs: [lint-typecheck, unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          DATABASE_URL: postgresql://innera:innera_dev@localhost:5432/innera_dev
```
