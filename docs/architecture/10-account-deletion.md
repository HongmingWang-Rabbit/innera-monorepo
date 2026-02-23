# 10. Account Deletion (GDPR / Apple)

> Section 15 of the architecture doc.

---

Apple App Store and GDPR both require users to be able to delete their accounts and all associated data. This MUST be implemented before App Store submission.

## Deletion Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Account Deletion Timeline                                   │
│                                                              │
│  Day 0: User requests deletion                               │
│    POST /v1/account/delete                                   │
│    → Requires re-authentication (OAuth within last 5 min)    │
│    → Creates account_deletion_requests row                   │
│    → Sends ACCOUNT_DELETE_SCHEDULED notification             │
│    → Sends confirmation email                                │
│    → User can still use the app during cooling period        │
│                                                              │
│  Day 0-7: Cooling period (reversible)                        │
│    POST /v1/account/cancel-delete                            │
│    → Cancels the request                                     │
│    → Sends ACCOUNT_DELETE_CANCELLED notification             │
│                                                              │
│  Day 7: Hard deletion (irreversible)                         │
│    Background job executes:                                  │
│    1. Revoke all sessions (delete all refresh tokens)        │
│    2. Delete all entries (hard delete, not soft)              │
│    3. Delete all comments and reactions                       │
│    4. Delete all attachments from S3/R2                       │
│    5. Delete all notifications                                │
│    6. Delete all push_tokens                                  │
│    7. Remove from all circles (trigger member-leave cascade) │
│    8. Revoke partner link if active                           │
│    9. Delete auth_identities                                  │
│    10. Delete user_settings                                   │
│    11. Anonymize audit_events: userId → 'deleted-user-{hash}'│
│    12. Anonymize users row:                                   │
│        displayName → 'Deleted User'                          │
│        email → NULL                                          │
│        avatarUrl → NULL                                      │
│        encryptionSalt → randomized                           │
│        deletedAt → now()                                     │
│    13. Log ACCOUNT_DELETED audit event (with anonymized id)  │
│                                                              │
│  Users row is kept (anonymized) to prevent FK constraint     │
│  violations in audit_events and circle history.              │
└─────────────────────────────────────────────────────────────┘
```

## account_deletion_requests table

```sql
account_deletion_requests
  id              UUID PK
  userId          UUID FK → users
  status          ENUM('PENDING','CANCELLED','COMPLETED')
  lastCompletedStep INT DEFAULT 0  -- checkpoint: last completed step (1-13)
  requestedAt     TIMESTAMP
  scheduledFor    TIMESTAMP       -- requestedAt + 7 days
  cancelledAt     TIMESTAMP?
  completedAt     TIMESTAMP?
```

**Resumable deletion:** Each of the 13 deletion steps is idempotent (e.g., "delete all entries for user X" is a no-op if already done). The BullMQ worker records `lastCompletedStep` after each step. On retry (crash, timeout), the worker reads `lastCompletedStep` and resumes from `lastCompletedStep + 1`. This ensures a partially-deleted account is always cleaned up fully.

## API Routes

```
POST /v1/account/delete           (requires X-Reauth-Token)
POST /v1/account/cancel-delete
GET  /v1/account/deletion-status
```
