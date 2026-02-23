# Innera Documentation

## Architecture

Detailed architecture documentation lives in [`architecture/`](architecture/00-overview.md), split into 18 focused files for efficient context loading.

| # | File | Topics |
|---|------|--------|
| 00 | [Overview](architecture/00-overview.md) | Index, changelog, V3 optimizations |
| 01 | [Stack & Config](architecture/01-stack.md) | Tech stack, repo structure, Next.js + Tamagui |
| 02 | [Auth](architecture/02-auth.md) | OAuth, guest mode, tokens, session revocation |
| 03 | [Encryption](architecture/03-encryption.md) | AES-256-GCM, key hierarchy, rotation, search |
| 04 | [Entry Content](architecture/04-entry-content.md) | Markdown format, editor, search strip |
| 05 | [Data Model](architecture/05-data-model.md) | Product model, visibility rules |
| 06 | [Partner Links](architecture/06-partner-links.md) | Partner state machine |
| 07 | [Circles](architecture/07-circles.md) | Permissions, approval, admin succession |
| 08 | [Notifications](architecture/08-notifications-realtime.md) | Push, WebSocket, realtime |
| 09 | [Export & Import](architecture/09-export-import.md) | Streaming export, format adapters |
| 10 | [Account Deletion](architecture/10-account-deletion.md) | GDPR/Apple, 7-day cooling period |
| 11 | [P0 Must-Haves](architecture/11-p0-must-haves.md) | Validation, rate limits, audit, idempotency |
| 12 | [DB Schema](architecture/12-db-schema.md) | Full Drizzle schema, all tables |
| 13 | [API Design](architecture/13-api-design.md) | Routes, CORS, pagination, attachments |
| 14 | [Mobile](architecture/14-mobile.md) | Offline sync, conflict detection |
| 15 | [Security](architecture/15-security.md) | XSS, CSP, sanitization |
| 16 | [Infrastructure](architecture/16-infrastructure.md) | Docker, DB pool, Redis, monitoring |
| 17 | [Testing & CI](architecture/17-testing-ci.md) | Test suites, CI pipeline |
| 18 | [DX](architecture/18-dx.md) | Commands, env vars, quick start |

## Edit History

Session logs tracking what changed and when: [`edit-history/`](edit-history/)

## Quick Links

- [README](../README.md) — Getting started, scripts, env vars
- [CLAUDE.md](../CLAUDE.md) — Claude Code guidance for this repo
