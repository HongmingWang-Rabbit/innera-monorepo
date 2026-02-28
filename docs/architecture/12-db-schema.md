# 12. DB Schema (Drizzle)

> Section 17 of the architecture doc.

---

## Full Table List

```
users
  id              UUID PK DEFAULT gen_random_uuid()
  displayName     VARCHAR(100)
  email           VARCHAR(255)
  avatarUrl       TEXT?
  encryptionSalt  BYTEA NOT NULL       -- per-user salt for HKDF key derivation
  encryptionVersion SMALLINT DEFAULT 1
  deletedAt       TIMESTAMPTZ?         -- for account deletion (anonymized row kept)
  createdAt       TIMESTAMPTZ DEFAULT now()
  updatedAt       TIMESTAMPTZ DEFAULT now()
  UNIQUE(email) WHERE deletedAt IS NULL
  -- trigger: BEFORE UPDATE → SET updatedAt = now()

auth_identities
  id              UUID PK
  userId          UUID FK → users ON DELETE CASCADE
  provider        VARCHAR(20) NOT NULL   -- 'google' | 'apple'
  providerUserId  TEXT NOT NULL          -- sub claim (primary identity key)
  email           VARCHAR(255)           -- informational only, not used for identity matching
  rawProfile      JSONB?
  createdAt       TIMESTAMPTZ
  UNIQUE(provider, providerUserId)

user_settings
  userId          UUID PK FK → users ON DELETE CASCADE
  theme           VARCHAR(10) DEFAULT 'system'
  notifyPartner   BOOLEAN DEFAULT true
  notifyCircle    BOOLEAN DEFAULT true
  notifyComments  BOOLEAN DEFAULT true
  notifyReactions BOOLEAN DEFAULT false
  defaultVisibility ENUM('PRIVATE','PARTNER','CIRCLE','FUTURE_CIRCLE_ONLY') DEFAULT 'PRIVATE'
  locale          VARCHAR(10) DEFAULT 'en'
  timezone        VARCHAR(50)?
  updatedAt       TIMESTAMPTZ

entries
  id              UUID PK
  authorId        UUID FK → users ON DELETE CASCADE
  titleEncrypted  BYTEA?                             -- ← encrypted with UEK (nullable, for list views)
  contentEncrypted BYTEA NOT NULL
  encryptionVersion SMALLINT DEFAULT 1
  visibility      ENUM('PRIVATE','PARTNER','CIRCLE','FUTURE_CIRCLE_ONLY')
  circleId        UUID? FK → circles ON DELETE SET NULL
  mood            VARCHAR(20)?
  version         INT DEFAULT 1                      -- for sync conflict detection
  conflictOf      UUID?                                  -- points to original if this is a conflict fork
                                                         -- Self-referencing FK added via migration SQL (not in Drizzle schema to avoid circular type)
  deletedAt       TIMESTAMPTZ?
  createdAt       TIMESTAMPTZ
  updatedAt       TIMESTAMPTZ
  -- trigger: BEFORE UPDATE → SET updatedAt = now()
  INDEX(authorId, deletedAt, createdAt DESC)
  INDEX(circleId)
  INDEX(authorId, updatedAt)                         -- for sync pull queries
  INDEX(conflictOf) WHERE conflictOf IS NOT NULL     -- for conflict resolution queries
  CHECK (
    (visibility IN ('PRIVATE', 'PARTNER') AND circleId IS NULL)
    OR
    (visibility IN ('CIRCLE', 'FUTURE_CIRCLE_ONLY') AND circleId IS NOT NULL)
  )

tags
  id              UUID PK
  name            VARCHAR(50) NOT NULL
  userId          UUID FK → users ON DELETE CASCADE
  UNIQUE(userId, lower(name))                        -- case-insensitive uniqueness

entry_tags
  entryId         UUID FK → entries ON DELETE CASCADE
  tagId           UUID FK → tags ON DELETE CASCADE
  PRIMARY KEY(entryId, tagId)

entry_key_grants
  id              UUID PK
  entryId         UUID FK → entries ON DELETE CASCADE
  userId          UUID FK → users ON DELETE CASCADE
  encryptedKey    BYTEA NOT NULL        -- ESK encrypted with viewer's UEK
  createdAt       TIMESTAMPTZ
  UNIQUE(entryId, userId)

partner_links
  id              UUID PK
  initiatorId     UUID FK → users ON DELETE CASCADE
  partnerId       UUID FK → users ON DELETE CASCADE
  status          ENUM('PENDING','ACTIVE','DECLINED','REVOKED')
  initiatedAt     TIMESTAMPTZ
  respondedAt     TIMESTAMPTZ?
  revokedAt       TIMESTAMPTZ?
  revokedBy       UUID? FK → users ON DELETE SET NULL
  INDEX(initiatorId, status)
  INDEX(partnerId, status)
  UNIQUE(initiatorId, partnerId) WHERE status IN ('PENDING', 'ACTIVE')  -- prevent duplicate pending requests
  -- Enforce at most ONE active partner link per user:
  UNIQUE(initiatorId) WHERE status = 'ACTIVE'
  UNIQUE(partnerId) WHERE status = 'ACTIVE'

circles
  id              UUID PK
  name            VARCHAR(100)
  description     TEXT?
  createdBy       UUID FK → users ON DELETE SET NULL
  status          ENUM('ACTIVE','ARCHIVED') DEFAULT 'ACTIVE'
  maxMembers      INT DEFAULT 20
  createdAt       TIMESTAMPTZ
  updatedAt       TIMESTAMPTZ DEFAULT now()  -- auto-updated via $onUpdate

circle_memberships
  id              UUID PK
  circleId        UUID FK → circles ON DELETE CASCADE
  userId          UUID FK → users ON DELETE CASCADE
  role            ENUM('OWNER','ADMIN','MEMBER') DEFAULT 'MEMBER'
  status          ENUM('ACTIVE','LEFT','REMOVED')
  joinedAt        TIMESTAMPTZ
  leftAt          TIMESTAMPTZ?
  historyPolicy   ENUM('ALL','FUTURE_ONLY')
  -- Partial unique index: allows rejoin history (old LEFT/REMOVED rows don't block new ACTIVE row)
  UNIQUE(circleId, userId) WHERE status = 'ACTIVE'

circle_join_requests
  id              UUID PK
  circleId        UUID FK → circles ON DELETE CASCADE
  requesterId     UUID FK → users ON DELETE CASCADE
  inviteId        UUID? FK → circle_invites ON DELETE SET NULL
  status          ENUM('PENDING','APPROVED','REJECTED','EXPIRED','CANCELLED')
  historyPolicy   ENUM('ALL','FUTURE_ONLY')
  requiredCount   INT                    -- dynamic: updated when membership changes
  currentCount    INT DEFAULT 0
  expiresAt       TIMESTAMPTZ
  createdAt       TIMESTAMPTZ
  resolvedAt      TIMESTAMPTZ?
  INDEX(circleId, status)
  INDEX(requesterId)

circle_join_approvals
  id              UUID PK
  requestId       UUID FK → circle_join_requests ON DELETE CASCADE
  approverId      UUID FK → users ON DELETE CASCADE
  decision        ENUM('APPROVE','REJECT')
  createdAt       TIMESTAMPTZ
  UNIQUE(requestId, approverId)

circle_invites
  id              UUID PK
  circleId        UUID FK → circles ON DELETE CASCADE
  invitedBy       UUID FK → users ON DELETE SET NULL
  inviteCode      VARCHAR(32) UNIQUE
  expiresAt       TIMESTAMPTZ
  maxUses         INT DEFAULT 1
  usedCount       INT DEFAULT 0
  createdAt       TIMESTAMPTZ
  INDEX(circleId)

comments
  id              UUID PK
  entryId         UUID FK → entries ON DELETE CASCADE
  authorId        UUID FK → users ON DELETE CASCADE
  contentEncrypted BYTEA NOT NULL     -- encrypted with ESK (or author UEK at MVP)
  deletedAt       TIMESTAMPTZ?
  createdAt       TIMESTAMPTZ
  INDEX(entryId)

reactions
  id              UUID PK
  entryId         UUID FK → entries ON DELETE CASCADE
  userId          UUID FK → users ON DELETE CASCADE
  emoji           VARCHAR(10)          -- not encrypted (non-sensitive)
  createdAt       TIMESTAMPTZ
  UNIQUE(entryId, userId, emoji)
  INDEX(entryId)

notifications
  id              UUID PK
  userId          UUID FK → users ON DELETE CASCADE
  type            ENUM('PARTNER_REQUEST','PARTNER_ACCEPTED','PARTNER_REVOKED',
                       'CIRCLE_INVITED','CIRCLE_JOIN_REQUEST','CIRCLE_APPROVED',
                       'CIRCLE_REJECTED','CIRCLE_REMOVED',
                       'COMMENT_ADDED','REACTION_ADDED',
                       'ACCOUNT_DELETE_SCHEDULED','ACCOUNT_DELETE_CANCELLED')
  title           VARCHAR(200)
  body            TEXT
  data            JSONB
  read            BOOLEAN DEFAULT false
  readAt          TIMESTAMPTZ?
  createdAt       TIMESTAMPTZ
  INDEX(userId, read, createdAt DESC)

push_tokens
  id              UUID PK
  userId          UUID FK → users ON DELETE CASCADE
  token           TEXT NOT NULL
  platform        ENUM('ios','android','web')
  createdAt       TIMESTAMPTZ
  updatedAt       TIMESTAMPTZ
  UNIQUE(userId, token)

audit_events
  id              UUID PK
  userId          UUID FK → users       -- anonymized on account delete, NOT cascaded
  action          VARCHAR(100)
  targetType      VARCHAR(50)
  targetId        UUID                   -- intentionally no FK (append-only log, survives target deletion)
  metadata        JSONB
  ipAddress       INET
  requestId       UUID
  createdAt       TIMESTAMPTZ
  INDEX(userId, createdAt DESC)
  INDEX(targetType, targetId)

attachments
  id              UUID PK
  entryId         UUID FK → entries ON DELETE CASCADE
  userId          UUID FK → users ON DELETE CASCADE
  storageKey      TEXT NOT NULL
  fileName        VARCHAR(255)
  mimeType        VARCHAR(100)
  sizeBytes       BIGINT
  encryptionVersion SMALLINT DEFAULT 1
  createdAt       TIMESTAMPTZ
  INDEX(entryId)
  -- Note: ON DELETE CASCADE deletes DB rows; S3/R2 objects cleaned by async job

account_deletion_requests
  id              UUID PK
  userId          UUID FK → users
  status          ENUM('PENDING','CANCELLED','COMPLETED')
  lastCompletedStep INT DEFAULT 0       -- checkpoint for resumable deletion (steps 1-13)
  requestedAt     TIMESTAMPTZ
  scheduledFor    TIMESTAMPTZ
  cancelledAt     TIMESTAMPTZ?
  completedAt     TIMESTAMPTZ?
  INDEX(status, scheduledFor)
  INDEX(userId)

import_jobs
  id              UUID PK
  userId          UUID FK → users ON DELETE CASCADE
  format          VARCHAR(20)
  status          ENUM('QUEUED','PROCESSING','COMPLETED','FAILED')
  totalEntries    INT?
  processedEntries INT DEFAULT 0
  failedEntries   INT DEFAULT 0
  errorMessage    TEXT?
  createdAt       TIMESTAMPTZ
  completedAt     TIMESTAMPTZ?
  INDEX(userId)

key_rotation_jobs
  id              UUID PK
  userId          UUID FK → users ON DELETE CASCADE
  fromVersion     SMALLINT NOT NULL
  toVersion       SMALLINT NOT NULL
  status          ENUM('RUNNING','PAUSED','COMPLETED','FAILED')
  totalEntries    INT
  processedEntries INT DEFAULT 0
  failedEntries   INT DEFAULT 0
  startedAt       TIMESTAMPTZ
  completedAt     TIMESTAMPTZ?
  INDEX(userId)
  lastError       TEXT?
```

### Required Triggers

```sql
-- Auto-update updatedAt on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updatedAt = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER entries_updated_at BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### V3+ Schema Changes Summary

| Change | Table | Column/Index | Reason |
|--------|-------|-------------|--------|
| `title` → `titleEncrypted` | entries | `titleEncrypted BYTEA?` | Encrypt title to match privacy promise |
| Add `version` | entries | `version INT DEFAULT 1` | Sync conflict detection |
| Add index | entries | `INDEX(circleId)` | Circle entry queries |
| Add index | entries | `INDEX(authorId, updatedAt)` | Sync pull queries |
| Add index | entries | `INDEX(conflictOf) WHERE NOT NULL` | Conflict resolution queries |
| Add CHECK | entries | visibility + circleId consistency | Prevent invalid state |
| Partial unique | circle_memberships | `UNIQUE ... WHERE status = 'ACTIVE'` | Allow rejoin after leave |
| Partial unique | partner_links | `UNIQUE(initiatorId/partnerId) WHERE ACTIVE` | Enforce one active partner |
| Dynamic count | circle_join_requests | `requiredCount` is dynamic | Updated on membership change |
| Add checkpoint | account_deletion_requests | `lastCompletedStep INT` | Resumable deletion job |
| Case-insensitive | tags | `UNIQUE(userId, lower(name))` | Prevent "Travel" vs "travel" |
| ENUM type | notifications | `type` is ENUM not VARCHAR | Type safety at DB level |
| `updatedAt` trigger | users, entries | `BEFORE UPDATE` trigger | Guarantee sync correctness |
| ON DELETE behavior | all FKs | CASCADE / SET NULL as appropriate | Prevent orphaned rows |
| `audit_events.targetId` | audit_events | no FK (intentional) | Append-only log |
| Add `userId` | key_rotation_jobs | `userId UUID FK → users ON DELETE CASCADE` | Associate rotation job with user |
| Add index | key_rotation_jobs | `INDEX(userId)` | Query rotation jobs by user |
| Add index | comments | `INDEX(entryId)` | Comment lookups by entry |
| Add index | reactions | `INDEX(entryId)` | Reaction lookups by entry |
| Add index | circle_join_requests | `INDEX(circleId, status)` | Join request queries by circle |
| Add index | circle_join_requests | `INDEX(requesterId)` | Join request queries by requester |
| Add index | account_deletion_requests | `INDEX(status, scheduledFor)` | Deletion job scheduling queries |
| Add index | account_deletion_requests | `INDEX(userId)` | Deletion status lookups by user |
| Add index | import_jobs | `INDEX(userId)` | Import job lookups by user |
| Add index | circle_invites | `INDEX(circleId)` | Invite lookups by circle |
| Partial unique | partner_links | `UNIQUE(initiatorId, partnerId) WHERE PENDING/ACTIVE` | Prevent duplicate pending requests |
| Unique partial | users | `UNIQUE(email) WHERE deletedAt IS NULL` | Unique email for non-deleted users |
| TIMESTAMP → TIMESTAMPTZ | all tables | all timestamp columns | Timezone-aware timestamps |
| ENUM type | user_settings | `defaultVisibility` uses visibilityEnum | Type safety at DB level |
