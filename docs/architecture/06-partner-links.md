# 6. Partner Links State Machine

> Section 8 of the architecture doc.

---

## State Machine

```
                    ┌──────────┐
        initiate    │ PENDING  │
   User A ────────→ │          │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              ▼                     ▼
        ┌──────────┐         ┌──────────┐
        │  ACTIVE  │         │ DECLINED │
        │          │         │ (delete) │
        └────┬─────┘         └──────────┘
             │
    either party revokes
             │
             ▼
        ┌──────────┐
        │ REVOKED  │
        │(softDel) │
        └──────────┘
```

## partner_links table

```sql
partner_links
  id              UUID PK
  initiatorId     UUID FK → users
  partnerId       UUID FK → users
  status          ENUM('PENDING','ACTIVE','DECLINED','REVOKED')
  initiatedAt     TIMESTAMP
  respondedAt     TIMESTAMP?
  revokedAt       TIMESTAMP?
  revokedBy       UUID? FK → users
```

## Rules

- A user can have at most ONE active partner link (enforced by partial unique indexes: `UNIQUE(initiatorId) WHERE status='ACTIVE'` and `UNIQUE(partnerId) WHERE status='ACTIVE'`).
- `PENDING` expires after 7 days (background job or check on read).
- Both parties can revoke. Revoking flips all `PARTNER` visibility entries by that user to `PRIVATE` (async job + audit event).
- Re-linking after revoke creates a new row (old row stays for audit).
