# 7. Circle Model, Permissions & Approval Concurrency

> Sections 9, 10 of the architecture doc.

---

## Invite vs Join — Two Distinct Flows

```
Flow A: Invitation (push — member invites someone)
──────────────────────────────────────────────────
  1. Any ACTIVE member generates an invite link
     POST /v1/circles/:id/invite → { inviteCode, inviteUrl }
  2. Invitee clicks link → presented with circle info + history policy choice
  3. Invitee accepts → circle_join_requests created (status: PENDING)
  4. All existing members must approve (unanimous)
  5. Approved → circle_memberships created

Flow B: Join Request (pull — outsider requests to join)
──────────────────────────────────────────────────────
  1. User discovers circle (via invite code shared externally)
     POST /v1/circles/:id/join { inviteCode, historyPolicy }
  2. circle_join_requests created (status: PENDING)
  3. All existing members must approve (unanimous)
  4. Approved → circle_memberships created

Both flows converge at the same approval process.
circle_invites is the invite link/code record.
circle_join_requests is the approval workflow record.
An invite can generate multiple join requests (if maxUses > 1).
```

## Permission Matrix

| Action | ADMIN | MEMBER |
|--------|-------|--------|
| Create invite link | Yes | Yes |
| Approve/reject join request | Yes | Yes (unanimous = everyone votes) |
| Remove a member | Yes | No |
| Delete circle | Yes (only if sole admin) | No |
| Transfer admin role | Yes | No |
| Update circle name/description | Yes | No |
| Leave circle | Yes (with succession rules below) | Yes |
| Post entries with CIRCLE visibility | Yes | Yes |

## Admin Succession Rules

```
When an ADMIN leaves:
  ├─ Other ADMINs exist?
  │   └─ YES → normal leave, no change
  │   └─ NO → is there at least one MEMBER?
  │       └─ YES → auto-promote earliest-joined ACTIVE member to ADMIN
  │       └─ NO  → circle status → ARCHIVED (no active members)
  │                 all CIRCLE visibility entries → revert to PRIVATE
  │                 all FUTURE_CIRCLE_ONLY entries → revert to PRIVATE

When an ADMIN is the last person:
  └─ Circle is ARCHIVED automatically
```

## FUTURE_CIRCLE_ONLY Archival Rule

When a circle is archived (last member leaves or admin archives it):
- All entries with `visibility = 'FUTURE_CIRCLE_ONLY'` in that circle **revert to `PRIVATE`**.
- All entries with `visibility = 'CIRCLE'` in that circle **also revert to `PRIVATE`**.
- This is handled by the same async job that processes the archival cascade.

## Removal Cascade

When a member is removed (kicked by admin):
- Their `circle_memberships.status` → `REMOVED`, `leftAt` → now.
- Any pending `circle_join_approvals` they cast are voided.
- Any pending `circle_join_requests` are recounted (may trigger auto-approve if remaining approvals meet new threshold).
- Their CIRCLE-visibility entries in that circle remain visible to other members (content was already shared) — but they can no longer post new ones.
- Notification sent: `CIRCLE_REMOVED`.

## circle_memberships UNIQUE Constraint

> **V3 optimization:** Use a partial unique index instead of a plain UNIQUE constraint.

```sql
-- Instead of: UNIQUE(circleId, userId)
-- Use partial unique index:
CREATE UNIQUE INDEX circle_memberships_active_unique
  ON circle_memberships(circleId, userId)
  WHERE status = 'ACTIVE';
```

**Why:** A plain `UNIQUE(circleId, userId)` prevents a user from rejoining a circle after leaving or being removed (the old row with status `LEFT`/`REMOVED` would conflict). The partial unique index only enforces uniqueness among `ACTIVE` memberships, allowing historical rows to coexist.

---

## Circle Unanimous Approval — Concurrency

### Problem

When a join request requires all N members to approve, concurrent events can corrupt state:
- Member leaves during voting → stale approval count.
- Multiple join requests processed simultaneously → race conditions.

### Solution: Row Locking (`FOR UPDATE`)

```sql
circle_join_requests
  id              UUID PK
  circleId        UUID FK → circles
  requesterId     UUID FK → users
  status          ENUM('PENDING','APPROVED','REJECTED','EXPIRED','CANCELLED')
  historyPolicy   ENUM('ALL','FUTURE_ONLY')
  requiredCount   INT        -- snapshot of member count at request time
  currentCount    INT DEFAULT 0
  expiresAt       TIMESTAMP  -- auto-expire after 14 days
  createdAt       TIMESTAMP
  resolvedAt      TIMESTAMP?

circle_join_approvals
  id              UUID PK
  requestId       UUID FK → circle_join_requests
  approverId      UUID FK → users
  decision        ENUM('APPROVE','REJECT')
  createdAt       TIMESTAMP
  UNIQUE(requestId, approverId)
```

> **V3 optimization:** Removed the `version INT DEFAULT 0` column and optimistic concurrency check from the approval flow. The `SELECT ... FOR UPDATE` row lock is sufficient to prevent concurrent corruption — the version check was redundant and added complexity.

### Approval Flow (pseudocode)

```typescript
async function submitApproval(requestId, approverId, decision) {
  return db.transaction(async (tx) => {
    // 1. Lock the join request row
    const request = await tx
      .select()
      .from(circleJoinRequests)
      .where(eq(id, requestId))
      .for('update');  // SELECT ... FOR UPDATE

    if (request.status !== 'PENDING') throw new AppError('REQUEST_NOT_PENDING');
    if (request.expiresAt < now()) {
      await tx.update(circleJoinRequests).set({ status: 'EXPIRED' });
      throw new AppError('REQUEST_EXPIRED');
    }

    // 2. Verify approver is still a member
    const membership = await tx.select().from(circleMemberships)
      .where(and(
        eq(circleId, request.circleId),
        eq(userId, approverId),
        eq(status, 'ACTIVE')
      ));
    if (!membership) throw new AppError('NOT_A_MEMBER');

    // 3. Record individual decision
    await tx.insert(circleJoinApprovals).values({
      requestId, approverId, decision
    });

    // 4. If REJECT → immediately reject
    if (decision === 'REJECT') {
      await tx.update(circleJoinRequests).set({
        status: 'REJECTED', resolvedAt: now()
      });
      return 'REJECTED';
    }

    // 5. If APPROVE → increment and check unanimity
    const newCount = request.currentCount + 1;
    await tx.update(circleJoinRequests)
      .set({ currentCount: newCount })
      .where(eq(id, requestId));

    // 5b. Check maxMembers before approving
    if (newCount >= request.requiredCount) {
      const circle = await tx.select().from(circles).where(eq(id, request.circleId));
      const activeCount = await tx.select({ count: count() }).from(circleMemberships)
        .where(and(eq(circleId, request.circleId), eq(status, 'ACTIVE')));
      if (activeCount >= circle.maxMembers) throw new AppError('CIRCLE_FULL');

      await tx.update(circleJoinRequests).set({
        status: 'APPROVED', resolvedAt: now()
      });
      await tx.insert(circleMemberships).values({
        circleId: request.circleId,
        userId: request.requesterId,
        joinedAt: now(),
        status: 'ACTIVE',
        historyPolicy: request.historyPolicy,
      });
      return 'APPROVED';
    }

    return 'PENDING';
  });
}
```

### Edge Cases

| Event | Handling |
|-------|---------|
| Member leaves during voting | **Dynamic recount:** Update `requiredCount` to current active member count. Void leaving member's approval and decrement `currentCount` if they had approved. If `currentCount >= new requiredCount` → auto-approve. If `requiredCount` drops to 0 (all members left) → auto-expire. |
| Member removed/banned | Same as leave — void their approval, recount. |
| Multiple simultaneous join requests | Each request has its own `requiredCount` snapshot. Processed independently. |
| Request expires | Background job or on-read check. Status → `EXPIRED`. |
| Requester cancels | Status → `CANCELLED`. |
