# 3. Encryption & Search + Shared Keys

> Sections 5, 11 of the architecture doc.

---

## Encryption at Rest (AES-256-GCM)

```
┌─────────────┐      ┌──────────────┐       ┌─────────────────┐
│   Client     │ ──→  │  API Server  │  ──→  │   PostgreSQL     │
│  (plaintext) │      │  encrypt()   │       │  (ciphertext)    │
└─────────────┘      └──────────────┘       └─────────────────┘
```

**Key hierarchy:**

```
Master Key (MEK)          → stored in env / KMS (AWS KMS, GCP KMS)
  └─ Per-User Key (UEK)  → derived: HKDF-SHA256(MEK, userId salt)
      └─ Per-Entry IV     → random 12 bytes per encrypt call
```

**Encrypted fields:** `entries.contentEncrypted` (bytea), storing:
```json
{ "iv": "<base64>", "ciphertext": "<base64>", "tag": "<base64>" }
```

**Schema addition:**
```sql
entries.contentEncrypted  BYTEA NOT NULL    -- AES-256-GCM ciphertext
entries.encryptionVersion SMALLINT DEFAULT 1 -- for key rotation
-- entries.content is REMOVED (no plaintext stored)
```

## Key Rotation Procedure

When the Master Encryption Key (MEK) needs to be rotated (security incident, scheduled policy, or compliance requirement):

```
┌──────────────────────────────────────────────────────────────┐
│                    Key Rotation Flow                          │
│                                                              │
│  1. Generate new MEK (version N+1), store in KMS             │
│  2. Deploy: API reads BOTH MEK_N and MEK_N+1                │
│     - Writes use MEK_N+1 (new key)                          │
│     - Reads check entry.encryptionVersion to pick key        │
│  3. Enqueue background job: re-encrypt all entries           │
│     - Batch 100 entries at a time                            │
│     - For each entry:                                        │
│       a. Derive old UEK from MEK_N + user salt              │
│       b. Decrypt content                                     │
│       c. Derive new UEK from MEK_N+1 + user salt            │
│       d. Re-encrypt content                                  │
│       e. UPDATE entry SET contentEncrypted=...,              │
│          encryptionVersion=N+1                               │
│     - Track progress in key_rotation_jobs table              │
│  4. Once 100% migrated → remove MEK_N from config           │
└──────────────────────────────────────────────────────────────┘
```

**key_rotation_jobs table:**
```sql
key_rotation_jobs
  id              UUID PK
  fromVersion     SMALLINT NOT NULL
  toVersion       SMALLINT NOT NULL
  status          ENUM('RUNNING','PAUSED','COMPLETED','FAILED')
  totalEntries    INT
  processedEntries INT DEFAULT 0
  failedEntries   INT DEFAULT 0
  startedAt       TIMESTAMP
  completedAt     TIMESTAMP?
  lastError       TEXT?
```

**Safety measures:**
- Never delete old MEK until migration is 100% complete and verified.
- Re-encryption is idempotent — re-running on already-migrated entries is a no-op (check version first).
- Rate-limit the background job to avoid saturating DB (100 entries/second max).
- If the job fails, it can resume from where it stopped (cursor stored in job row).

**Salt rotation during key rotation:** When rotating the MEK, also rotate each user's `encryptionSalt` to a fresh random value. The new UEK is derived from `HKDF(new_MEK, new_salt)`. This prevents an attacker who captured the old MEK + old salt from deriving the new UEK. The rotation job re-derives the old UEK (old MEK + old salt), decrypts, generates new salt, derives new UEK (new MEK + new salt), re-encrypts, and updates both `encryptionSalt` and `encryptionVersion` atomically per user.

## Search — Server-side Decrypt

```
GET /v1/entries/search?q=keyword&cursor=xxx&limit=20

Flow:
1. Load user's entries (paginated by createdAt DESC, batch of 200)
2. Derive UEK from userId
3. Decrypt each entry in memory
4. Strip markdown syntax, then string match / simple tokenizer against query
5. Collect matches until limit reached or all entries scanned
6. Return matches + nextCursor for continuation
```

**Performance guardrails:**
- Max scan per request: 500 entries (return partial results + `hasMore: true`)
- Streaming decryption — don't load all into memory at once
- Future upgrade path: blind index when entry count per user > 5,000

**Search completeness indicator:**

```typescript
// Response shape
{
  "data": [...],
  "pagination": { "nextCursor": "...", "hasMore": true },
  "search": {
    "scannedCount": 500,    // how many entries were scanned
    "totalCount": 3200,     // user's total entry count
    "isComplete": false     // false = partial results, more available
  }
}
```

When `isComplete: false`, the client shows a partial-results banner. The user can send `cursor` to continue scanning the next batch.

**Search service abstraction:**
```typescript
// packages/shared/src/search/SearchService.ts
interface SearchService {
  search(userId: string, query: string, opts: SearchOpts): Promise<SearchResult>;
}

// Implement: ServerDecryptSearchService (MVP)
// Future:   BlindIndexSearchService, ClientSearchService
```

---

## Shared Encryption for Comments & Reactions

### Problem

Comments are shared content — all circle/partner viewers can read them. But we encrypt content at rest. Whose key do we use?

### Solution: Entry-scoped Shared Key

Each entry that has `visibility != PRIVATE` gets an **entry shared key (ESK)** that is distributed to all authorized viewers.

```
┌─────────────────────────────────────────────────────────────┐
│  Entry Shared Key (ESK) Model                               │
│                                                              │
│  When entry visibility is set to PARTNER or CIRCLE:          │
│    1. Generate a random AES-256 key → ESK                    │
│    2. For each authorized viewer (partner or circle members):│
│       encrypt(ESK, viewerUEK) → store in entry_key_grants   │
│    3. Comments on this entry are encrypted with ESK          │
│    4. Entry content itself remains encrypted with author UEK │
│       (only author can edit; viewers read via API)           │
│                                                              │
│  When a new member joins the circle:                         │
│    - For each visible entry (respecting historyPolicy):      │
│      encrypt(ESK, newMemberUEK) → new entry_key_grants row  │
│                                                              │
│  When visibility reverts to PRIVATE:                         │
│    - Delete entry_key_grants EXCEPT the author's own grant   │
│    - Author retains their grant to read existing comments    │
│    - No new comments allowed                                 │
└─────────────────────────────────────────────────────────────┘
```

**entry_key_grants table:**
```sql
entry_key_grants
  id              UUID PK
  entryId         UUID FK → entries
  userId          UUID FK → users
  encryptedKey    BYTEA NOT NULL     -- ESK encrypted with viewer's UEK
  createdAt       TIMESTAMP
  UNIQUE(entryId, userId)
```

**MVP Simplification:**

If full ESK distribution is too complex for MVP, use a simpler approach:
- Comments are encrypted with the **entry author's UEK**.
- The API decrypts comments server-side before returning to authorized viewers.
- This is less pure (server has access to all keys), but since we're already doing server-side encryption (not E2E), this is consistent with the threat model.
- Mark this as a future upgrade path to per-entry shared keys when moving toward E2E encryption.

**Reactions** are not encrypted (they are just emoji + userId, no sensitive content).

---

## Attachment Encryption — Known Limitation

> **Current state (MVP):** Attachments (images, videos) stored in S3/R2 are **not encrypted at rest** by the application layer. They rely on storage-level encryption (S3 SSE or R2 default encryption).

**Why:** Encrypting large binary files with per-user keys adds significant complexity to the presigned URL upload/download flow. The current server-side encryption model (where the server holds key material) means application-layer attachment encryption provides limited additional security over storage-level encryption.

**Upgrade path (post-MVP):**
1. **Phase 1:** Enable S3 SSE-KMS with a per-user KMS key alias — adds key-per-user separation without changing the upload flow.
2. **Phase 2:** Client-side attachment encryption — encrypt before upload, decrypt after download. Requires changes to the presigned URL flow (client uploads ciphertext directly) and key distribution for shared entries via ESK.
