# 16. Infrastructure, Monitoring & Logging

> Sections 21, 22, 25 of the architecture doc.

---

## docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: innera
      POSTGRES_USER: innera
      POSTGRES_PASSWORD: innera_dev
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U innera"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    mem_limit: 512m
    command: >
      postgres
      -c max_connections=100
      -c shared_buffers=256MB

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redisdata:/data
    # REDIS_URL=redis://:devpassword@localhost:6379
    command: redis-server --requirepass devpassword
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "devpassword", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # S3_ENDPOINT: http://localhost:9000
  minio:
    image: minio/minio:RELEASE.2025-02-18T16-25-55Z
    ports:
      - '9000:9000'   # S3 API
      - '9001:9001'   # Console UI
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - miniodata:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    mem_limit: 256m
    command: server /data --console-address ":9001"

  # Auto-create the default bucket on first run
  createbuckets:
    image: minio/mc:RELEASE.2025-02-18T00-47-29Z
    depends_on:
      minio:
        condition: service_healthy
    restart: "no"
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 minioadmin minioadmin;
      mc mb --ignore-existing local/innera-attachments;
      "

volumes:
  pgdata:
  redisdata:
  miniodata:
```

## Database Connection Pooling

```typescript
// packages/db/src/client.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX ?? '20', 10),
  min: parseInt(process.env.DB_POOL_MIN ?? '5', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS ?? '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS ?? '5000', 10),
  ssl: process.env.DB_SSL === 'false' ? false
    : (process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false),
});

// Monitor pool health
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected DB pool error');
});

// Expose for health check
export async function checkDbHealth(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}

export const db = drizzle(pool);
```

**Sizing guidance:**

```
Rule of thumb: max pool size per instance = (Postgres max_connections - 10) / number_of_API_instances

Example:
  Postgres max_connections = 100
  3 API instances
  Pool max per instance = (100 - 10) / 3 ≈ 30
  Set max: 25 (leave headroom for migrations, Drizzle Studio, etc.)
```

## Redis Usage

| Use Case | Key Pattern | TTL |
|----------|------------|-----|
| Refresh tokens | `rt:{SHA256(token)}` → `{ userId, createdAt }` | 30 days |
| Rate limit counters | `rl:{route}:{ip or userId}` | auto (plugin managed) |
| Push notification queue | BullMQ queue `push-notifications` | until processed |
| Notification unread count cache | `notif:unread:{userId}` | 5 min |
| Idempotency cache | `idempotency:{userId}:{key}` → `{ statusCode, body }` | 24 hours |
| Idempotency lock | `idempotency:{userId}:{key}:lock` | 30 seconds |
| WebSocket user channels | `ws:user:{userId}` (pub/sub) | n/a (pub/sub) |
| Import/export job queue | BullMQ queue `import-jobs`, `export-jobs` | until processed |

---

## Monitoring & Alerting

### Error Tracking — Sentry

```typescript
// Both frontend (web + mobile) and backend

// Backend setup (apps/api/src/sentry.ts)
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,          // 10% of transactions for performance
  beforeSend(event) {
    // Scrub PII from error events
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },
});

// Frontend setup (packages/app/src/sentry.ts)
// Use @sentry/react-native for mobile, @sentry/nextjs for web
```

**Sentry integration with Fastify:**
```typescript
app.setErrorHandler((error, request, reply) => {
  if (!(error instanceof AppError)) {
    Sentry.captureException(error, {
      extra: {
        requestId: request.id,
        userId: request.user?.id,
        url: request.url,
        method: request.method,
      },
    });
  }
  // ... existing error handler logic
});
```

### Metrics — Prometheus-compatible

```typescript
// Using fastify-metrics (prom-client wrapper)
import metricsPlugin from 'fastify-metrics';

app.register(metricsPlugin, {
  endpoint: '/metrics',           // GET /metrics for Prometheus scraping
  defaultMetrics: { enabled: true },
  routeMetrics: { enabled: true },
});

// Custom business metrics
import { Counter, Histogram, Gauge } from 'prom-client';

const entryCreatedCounter = new Counter({
  name: 'innera_entries_created_total',
  help: 'Total entries created',
});

const searchLatencyHistogram = new Histogram({
  name: 'innera_search_duration_seconds',
  help: 'Search operation latency',
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const dbPoolGauge = new Gauge({
  name: 'innera_db_pool_active',
  help: 'Active DB connections',
});

const wsConnectionsGauge = new Gauge({
  name: 'innera_ws_connections_active',
  help: 'Active WebSocket connections',
});
```

### Key Metrics to Track

| Metric | Type | Alert Threshold |
|--------|------|----------------|
| HTTP 5xx error rate | Counter | > 1% of requests over 5 min |
| Request latency p95 | Histogram | > 2s for any endpoint |
| Request latency p99 | Histogram | > 5s for any endpoint |
| DB connection pool active | Gauge | > 80% of max |
| DB connection pool waiting | Gauge | > 0 for 1 min |
| Redis connection errors | Counter | > 0 in 1 min |
| WebSocket active connections | Gauge | monitoring only |
| Failed push notifications | Counter | > 10% failure rate |
| Encryption/decryption errors | Counter | > 0 (immediate alert) |
| Account deletion jobs failed | Counter | > 0 (immediate alert) |
| Key rotation progress | Gauge | monitoring during rotation |
| Search scan duration | Histogram | > 5s p95 |

### Uptime Monitoring

External probe (UptimeRobot, Pingdom, or similar) hitting:
- `GET /health` every 60s — basic liveness
- `GET /health/ready` every 60s — dependency health
- Alert on 2 consecutive failures

### Alerting Channels

```
Critical (page on-call):
  - 5xx rate > 1%, DB pool exhaustion, encryption errors, Redis down

Warning (Slack notification):
  - p95 latency > 2s, push notification failure spike, disk > 80%

Info (dashboard only):
  - WebSocket connection count, daily active users, entries created
```

---

## Logging

### Pino Configuration with Redact

```typescript
import Fastify from 'fastify';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-reauth-token"]',
        'req.headers["idempotency-key"]',
        'req.body.code',
        'req.body.codeVerifier',
        'req.body.identityToken',
        'req.body.refreshToken',
        'res.headers["set-cookie"]',
        '*.email',
        '*.password',
        '*.token',
        '*.accessToken',
        '*.refreshToken',
      ],
      censor: '[REDACTED]',
    },
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          requestId: request.id,
          userId: request.user?.id,
        };
      },
    },
  },
  genReqId: () => crypto.randomUUID(),
});

app.addHook('onRequest', async (request) => {
  if (request.user) {
    request.log = request.log.child({ userId: request.user.id });
  }
});
```

---

## Production Deployment

> **V3 addition:** Brief deployment guidance.

**Recommended setup:**
- **Container orchestration:** Docker containers on Fly.io, Railway, or AWS ECS. Start with a single region, scale horizontally as needed.
- **Database:** Managed Postgres (Neon, Supabase, or RDS). Use connection pooling (PgBouncer or built-in) for serverless-friendly workloads.
- **Redis:** Managed Redis (Upstash for serverless, or ElastiCache/MemoryDB). Ensure persistence is enabled for BullMQ job queues.
- **Object storage:** Cloudflare R2 (no egress fees) or AWS S3.
- **Domain:** `api.innera.app` for backend, `innera.app` for web frontend.
- **TLS:** Enforced everywhere. Use platform-managed certificates.

## Backup Strategy

> **V3 addition.**

- **Database:** Automated daily backups via managed Postgres provider (point-in-time recovery, 7-day retention minimum). Test restore quarterly.
- **Object storage (R2/S3):** Enable versioning on the attachments bucket. Cross-region replication for disaster recovery (optional at MVP, recommended before launch).
- **Redis:** Redis is ephemeral for rate limits and caches — no backup needed. BullMQ job state can be reconstructed from the DB job tables (`import_jobs`, `key_rotation_jobs`, etc.) if Redis is lost.
- **Encryption keys:** MEK stored in KMS (AWS KMS / GCP KMS) which handles its own replication and backup. Keep an offline backup of the MEK in a secure vault (e.g., 1Password team vault or hardware security module).

## Redis High Availability

Redis is a single point of failure for multiple critical paths (refresh tokens, rate limiting, job queues, pub/sub). In production:
- **Option A (recommended):** Use a managed Redis service with built-in replication (Upstash, ElastiCache with Multi-AZ, MemoryDB).
- **Option B:** Run Redis Sentinel for automatic failover.
- **Refresh token resilience:** Consider storing refresh tokens in PostgreSQL (with TTL cleanup) instead of Redis, so a Redis outage does not lock out all users. Keep rate limits, caches, and pub/sub in Redis where eventual consistency is acceptable.

## Graceful Shutdown

During deployments (rolling restarts), handle in-flight work cleanly:

```typescript
// apps/api/src/server.ts
const shutdown = async () => {
  // 1. Stop accepting new connections
  await app.close(); // Fastify graceful close

  // 2. Close WebSocket connections with "server going away" code
  // Clients will auto-reconnect to a new instance
  wsConnections.forEach(ws => ws.close(4000, 'Server restarting'));

  // 3. Let BullMQ workers finish current jobs
  await pushWorker.close();     // waits for current job to finish
  await importWorker.close();
  await deletionWorker.close();

  // 4. Close DB pool
  await pool.end();

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Set a hard timeout in case graceful shutdown hangs
setTimeout(() => process.exit(1), 30_000);
```
