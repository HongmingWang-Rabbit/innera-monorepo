# 9. Export & Import

> Section 14 of the architecture doc.

---

## Export

```
GET /v1/export/json
GET /v1/export/markdown
```

**Security measures:**

| Measure | Implementation |
|---------|---------------|
| Rate limit | 3 exports per hour per user (`@fastify/rate-limit` keyed on userId) |
| Re-authentication | Require OAuth re-consent within last 5 min (via `X-Reauth-Token` header) |
| Streaming | Use `reply.raw` with Node.js `Readable` stream — decrypt and serialize entries in chunks, never load all into memory |
| Size cap | Max 10,000 entries per export. If user has more, provide paginated export or background job with download link |
| Audit | Write `EXPORT_JSON` / `EXPORT_MARKDOWN` audit event with timestamp and entry count |
| Encryption in transit | HTTPS only (enforced) |
| No caching | `Cache-Control: no-store` header on export responses |

**Streaming export pseudocode:**

```typescript
app.get('/v1/export/json', async (request, reply) => {
  const userId = request.user.id;

  await auditLog(userId, 'EXPORT_JSON');

  reply.header('Content-Type', 'application/json');
  reply.header('Content-Disposition', 'attachment; filename="innera-export.json"');
  reply.header('Cache-Control', 'no-store');

  const stream = new Readable({ read() {} });
  reply.send(stream);

  stream.push('{"entries":[');
  let first = true;

  for await (const batch of iterateUserEntries(userId, 100)) {
    for (const entry of batch) {
      const decrypted = decrypt(entry.contentEncrypted, deriveKey(userId));
      if (!first) stream.push(',');
      stream.push(JSON.stringify({ ...entry, content: decrypted }));
      first = false;
    }
  }

  stream.push(']}');
  stream.push(null);
});

// Error handling note: if decryption or DB fails mid-stream, HTTP 200 has
// already been sent. To handle this, wrap the iteration in try/catch:
// on error, push an "error" field into the JSON before closing the stream.
// For large exports (>5,000 entries), prefer a background job approach:
// enqueue a BullMQ job, produce the file to S3/R2, and return a download URL.
// This allows full validation before delivery and avoids truncated exports.
```

## Import

```
POST /v1/import/json       — Innera JSON format (re-import exported data)
POST /v1/import/markdown    — Folder of .md files (ZIP upload)
POST /v1/import/dayone      — Day One JSON export format
```

**Import flow:**

```
┌──────────────────────────────────────────────────────────┐
│  Import Pipeline                                          │
│                                                           │
│  1. Client uploads file → POST /v1/import/{format}        │
│     (multipart/form-data, max 100MB)                     │
│                                                           │
│  2. Server validates format + creates import_jobs row     │
│     Returns { jobId, status: 'QUEUED' }                  │
│                                                           │
│  3. BullMQ worker picks up job:                           │
│     a. Parse file according to format adapter             │
│     b. For each entry:                                    │
│        - Validate content (sanitize, strip unsafe HTML)   │
│        - Convert to Markdown if needed                    │
│        - Encrypt with user's UEK                          │
│        - INSERT into entries (visibility: PRIVATE)        │
│        - Preserve original createdAt if available         │
│     c. Import tags if present in source format            │
│     d. Update import_jobs: processedCount, status         │
│                                                           │
│  4. Client polls GET /v1/import/jobs/:jobId               │
│     or receives WS event: { type: 'import_complete' }    │
│                                                           │
│  Rate limit: 3 imports per day per user                   │
│  Audit: IMPORT_{FORMAT} event logged                      │
└──────────────────────────────────────────────────────────┘
```

**import_jobs table:**
```sql
import_jobs
  id              UUID PK
  userId          UUID FK → users
  format          VARCHAR(20)       -- 'json' | 'markdown' | 'dayone'
  status          ENUM('QUEUED','PROCESSING','COMPLETED','FAILED')
  totalEntries    INT?
  processedEntries INT DEFAULT 0
  failedEntries   INT DEFAULT 0
  errorMessage    TEXT?
  createdAt       TIMESTAMP
  completedAt     TIMESTAMP?
```

**Format adapters:**

| Source | Adapter logic |
|--------|--------------|
| Innera JSON | Direct mapping, validate schema with zod. **Deduplication:** match on original entry `id` — skip if entry with same `id` already exists for this user. |
| Markdown ZIP | Each `.md` file → one entry; filename or first `# heading` → title; file modified date → `createdAt` |
| Day One JSON | Map `entries[].text` → content; `entries[].creationDate` → `createdAt`; `entries[].tags` → tags; `entries[].weather` → metadata (stored in entry JSONB field, future use). **Deduplication:** hash `(userId, createdAt, first 200 chars of content)` — skip if duplicate hash found. |
