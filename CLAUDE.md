# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Innera is a privacy-first journaling app with end-to-end encryption, partner sharing, and circle-based communities. Cross-platform monorepo: Next.js web + Expo mobile + Fastify API.

## Commands

```bash
# Development
pnpm dev                    # Start all apps (API :3001, Web :3000, Mobile :19006)
pnpm build                  # Build everything via Turborepo
pnpm typecheck              # TypeScript checking across all packages
pnpm lint                   # ESLint across all packages

# Database
pnpm db:generate            # Generate Drizzle migration files
pnpm db:migrate             # Apply migrations to PostgreSQL
pnpm db:studio              # Open Drizzle Studio GUI

# Testing
pnpm test:unit              # Unit tests (vitest)
pnpm test:integration       # Integration tests (needs DB + Redis)
pnpm test:e2e               # E2E tests

# Run tests for a single package
pnpm --filter @innera/shared test:unit
pnpm --filter @innera/db test:unit

# Typecheck a single package
pnpm --filter @innera/api typecheck

# Infrastructure
docker compose up -d        # Start PostgreSQL + Redis
pnpm clean                  # Clean all build artifacts and caches
```

## Architecture

### Monorepo Layout

```
apps/
  api/      → Fastify 5 REST API (uses @innera/db + @innera/shared)
  web/      → Next.js 15 web app (uses @innera/app + @innera/ui)
  mobile/   → Expo 52 mobile app (uses @innera/app + @innera/ui)

packages/
  shared/   → Zod schemas, TypeScript types, permission helpers, AppError
  db/       → Drizzle ORM schema, PostgreSQL client, migrations
  ui/       → Tamagui design system: Button, Card, Input, Text components
  app/      → Shared screens & navigation (consumed by both web and mobile)
```

### Dependency Graph (no circular deps)

```
shared ← db ← api
shared ← ui ← app ← web
              app ← mobile
```

### Module System

- All packages use **ESM** (`"type": "module"` in package.json)
- Workspace packages import **source directly** (`"main": "./src/index.ts"`) — no pre-built dist in development
- Build outputs go to `dist/` via `tsc -p tsconfig.build.json`
- `tsconfig.base.json`: target ES2022, module ESNext, moduleResolution bundler, strict true

### Cross-Platform Screen Sharing

Screens live in `packages/app/src/screens/` and are consumed by both `apps/web` (via Next.js App Router pages) and `apps/mobile` (via Expo Router). Navigation uses Solito's `useLink()` for universal path-based routing. All screens import UI components from `@innera/ui`, never directly from `tamagui`.

### Fastify API Structure

Plugin registration order in `apps/api/src/server.ts` matters:
1. CORS → 2. Cookie → 3. Redis → 4. Rate Limit → 5. WebSocket → 6. Health Routes → 7. V1 Routes

- Routes: `src/routes/v1/*.ts` (auth, entries, partner, circles, notifications, settings, users, attachments, import-export, account, push-tokens, comments, reactions)
- Auth: `src/middleware/auth.ts` — `authenticate` and `optionalAuth` preHandlers using jose JWT
- All request bodies validated through shared Zod schemas from `@innera/shared`
- Error handling: AppError (custom status), ZodError (400), FastifyError (429/status), generic (500)
- Logger: Pino with redacted auth headers, cookies, passwords, tokens

### Database (Drizzle ORM)

Schema is in `packages/db/src/schema.ts` — ~22 tables with pgEnums. Key patterns:
- All timestamps use `{ withTimezone: true }` (PostgreSQL `timestamptz`)
- Partial unique indexes (e.g., `circle_memberships` WHERE status='ACTIVE')
- Soft delete via `deletedAt` column on users and entries
- Encrypted content stored as `bytea` columns
- Version column on entries for conflict detection
- Client in `packages/db/src/client.ts` with configurable pool (env vars: `DB_POOL_MAX`, `DB_POOL_MIN`, `DB_SSL`)

### Tamagui UI Components

`packages/ui` provides `Button`, `Card`, `Input`, `Text` (with `Heading`, `Caption`, `Label` variants) built on Tamagui's `styled()`. Config in `tamagui.config.ts` defines size/space/radius tokens and light/dark themes with a full color palette. Components use **named variants** not raw tokens:
- Button sizes: `"sm" | "md" | "lg"`, variants: `"primary" | "secondary" | "ghost" | "danger"`
- Card padding: `"none" | "sm" | "md" | "lg" | "xl"`, variants: `"elevated" | "flat"`
- Card does NOT have a `bordered` prop (has default border)
- Button does NOT have `color` or `icon` props

### Encryption Model

AES-256-GCM client-side encryption. Key hierarchy: Master Key → Per-User Key (HKDF-SHA256) → Per-Entry IV. Key rotation via BullMQ background jobs with version tracking.

### Async Jobs (BullMQ)

Redis-backed queues for: push notifications, import/export, account deletion (7-day cooling period), encryption key rotation, email (Resend).

## Key Conventions

- **Zod schemas** in `packages/shared/src/schemas/` are the single source of truth for validation. Enum values are derived from const objects in `types/index.ts` — never duplicate enum strings.
- **Permissions** in `packages/shared/src/permissions/` take a `ViewerContext` with `circleMemberships` (must include `status` field) and check visibility, role, and membership status.
- **API routes** use Fastify's plugin pattern with `fastify-plugin` wrapper. All protected routes use `preHandler: [authenticate]`.
- **React/react-native** are `peerDependencies` in `@innera/ui` and `@innera/app` (not regular dependencies) to avoid duplicate React instances.
- Route-level rate limits on auth endpoints (10 req/min). Global rate limit: 300 req/min per IP.

## Architecture Docs

Detailed docs in `docs/architecture/` (18 files). Key references:
- `02-auth.md` — OAuth flows, guest mode, token lifecycle
- `03-encryption.md` — Key hierarchy, rotation, search on encrypted data
- `12-db-schema.md` — Full Drizzle schema with all tables
- `13-api-design.md` — All API routes, pagination, file uploads
- `14-mobile.md` — Offline sync, conflict detection, SQLite
