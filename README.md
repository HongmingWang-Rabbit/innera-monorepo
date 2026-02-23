# innera

A privacy-first journaling app with end-to-end encryption, partner sharing, and circle-based communities. Cross-platform (web + mobile) monorepo.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, Expo 52, React Native 0.76, Tamagui, Solito |
| **Backend** | Fastify 5, Zod, BullMQ, Pino |
| **Database** | PostgreSQL 16, Drizzle ORM, Redis 7 |
| **Auth** | JWT (jose), Google OAuth, Apple Sign-In, Guest mode |
| **Encryption** | End-to-end encrypted entries with per-user master keys |
| **Build** | pnpm 10, Turborepo, TypeScript 5.7 |

## Monorepo Structure

```
apps/
  api/        @innera/api      Fastify REST API
  web/        @innera/web      Next.js web app
  mobile/     @innera/mobile   Expo mobile app

packages/
  shared/     @innera/shared   Types, schemas, permissions, errors
  db/         @innera/db       Drizzle schema, migrations, client
  ui/         @innera/ui       Tamagui design system & components
  app/        @innera/app      Shared screens & navigation (web + mobile)
```

## Prerequisites

- Node.js >= 20
- pnpm >= 10
- Docker (for PostgreSQL & Redis)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start infrastructure (Postgres + Redis)
docker compose up -d

# Copy environment variables
cp .env.example .env

# Generate database migrations
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Start all apps in dev mode
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm test:unit` | Run unit tests |
| `pnpm test:integration` | Run integration tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:studio` | Open Drizzle Studio (DB GUI) |
| `pnpm clean` | Clean all build artifacts and caches |

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `MASTER_ENCRYPTION_KEY` | Yes | 32-byte hex key for server-side encryption |
| `COOKIE_SECRET` | Yes | Secret for signing cookies |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `APPLE_CLIENT_ID` | No | Apple Sign-In client ID |
| `S3_BUCKET` | No | S3/R2 bucket for attachments |
| `SENTRY_DSN` | No | Sentry error tracking DSN |

## Architecture Docs

Detailed architecture documentation is in [`/docs/architecture/`](docs/architecture/00-overview.md), covering auth flows, encryption, data model, API design, mobile sync, and more.
