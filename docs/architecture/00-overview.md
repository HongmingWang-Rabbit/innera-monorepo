# Innera — Privacy-First Journaling App Architecture

> **Split from V3 monolith doc.** Each section is a standalone file for efficient context loading.

## Changelog from V2

Added WebSocket realtime layer, encryption key rotation procedure, API idempotency (Idempotency-Key), sync conflict detection with diff-merge UI, data import (JSON/Markdown/Day One), GDPR-compliant account deletion with 7-day cooling period, Circle permission rules (invite/kick/admin transfer/last-admin-leave), entry content format spec (Markdown), search completeness indicator, XSS/content sanitization, monitoring & alerting (Sentry + metrics), Circle invite-vs-join flow clarification, shared encryption key for comments/reactions, push_token lifecycle & cleanup, DB connection pooling configuration.

### V3 Optimizations Applied

- **Partial unique index** on `circle_memberships(circleId, userId) WHERE status = 'ACTIVE'` (allows rejoin history)
- **Idempotency plugin** uses `onSend` hook + Redis `SET NX` lock (fixes `reply.then()` + thundering herd)
- **Version-based sync conflict detection** (`version INT` column on entries, replaces `updatedAt` comparison)
- **WebSocket auth** via first-message token (not query param)
- **Entry `title`** column added (`VARCHAR(200)`, nullable)
- **Missing indexes** added: `INDEX(circleId)`, `INDEX(authorId, updatedAt)` on entries
- **BullMQ** added to stack (job queue for push, import, export, deletion, key rotation)
- **Email service** (Resend) added to stack
- **`PATCH /v1/users/me`** endpoint added
- **Rate limit** on `POST /v1/partner/respond` (10 req/min)
- **`FUTURE_CIRCLE_ONLY` archival** rule documented (revert to PRIVATE when circle archived)
- **Attachment encryption** known-limitation + upgrade path noted
- **`stripMarkdown`** recommends `remark` parser over regex for production
- **Approval flow** simplified (removed redundant version check, `FOR UPDATE` suffices)
- **Production deployment** and **backup strategy** notes added

---

## Table of Contents

| # | File | Topics |
|---|------|--------|
| 01 | [Stack, Repo & Config](./01-stack.md) | Tech stack, repo structure, Next.js + Tamagui config |
| 02 | [Auth](./02-auth.md) | OAuth providers, guest mode, tokens, session revocation |
| 03 | [Encryption & Search](./03-encryption.md) | AES-256-GCM, key hierarchy, rotation, search, shared keys |
| 04 | [Entry Content Format](./04-entry-content.md) | Markdown spec, editor selection, search strip |
| 05 | [Data Model](./05-data-model.md) | Product model, visibility rules |
| 06 | [Partner Links](./06-partner-links.md) | Partner state machine |
| 07 | [Circles](./07-circles.md) | Circle model, permissions, approval concurrency |
| 08 | [Notifications & Realtime](./08-notifications-realtime.md) | Notifications, WebSocket, push tokens |
| 09 | [Export & Import](./09-export-import.md) | Export/import flows, format adapters |
| 10 | [Account Deletion](./10-account-deletion.md) | GDPR/Apple account deletion |
| 11 | [P0 Must-Haves](./11-p0-must-haves.md) | Validation, rate limits, audit, idempotency |
| 12 | [DB Schema](./12-db-schema.md) | Full Drizzle schema (all tables) |
| 13 | [API Design](./13-api-design.md) | Routes, CORS, pagination, attachments |
| 14 | [Mobile Architecture](./14-mobile.md) | Offline, sync, conflict detection |
| 15 | [Content Security](./15-security.md) | XSS, CSP, sanitization |
| 16 | [Infrastructure](./16-infrastructure.md) | Docker, DB pool, Redis, monitoring, logging |
| 17 | [Testing & CI](./17-testing-ci.md) | Test suites, CI pipeline |
| 18 | [DX](./18-dx.md) | Commands, env vars, quick start |
