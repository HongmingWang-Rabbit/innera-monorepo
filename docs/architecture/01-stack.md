# 1. Stack, Repo Structure & Next.js Config

> Sections 1–3 of the architecture doc.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm + Turborepo |
| Universal React UI | React Native + react-native-web + Solito |
| Styling | Tamagui (cross-platform tokens, themes, media queries) |
| Mobile | Expo RN (TypeScript) |
| Web | Next.js App Router (TypeScript) |
| Backend | Node.js TypeScript + Fastify |
| Realtime | `@fastify/websocket` + Redis Pub/Sub |
| DB | PostgreSQL + Drizzle ORM |
| Cache / Rate-limit | Redis (sessions, rate-limit counters, pub/sub, idempotency, push queue) |
| Job Queue | BullMQ (push notifications, import/export, account deletion, key rotation) |
| Email | Resend (transactional emails: account deletion confirmation, partner invites) |
| Validation | zod |
| Logging | pino (Fastify logger) with redact config |
| Monitoring | Sentry (errors) + Prometheus-compatible metrics |
| Tests | Vitest unit + integration |
| E2E | Web: Playwright, Mobile: Maestro |
| CI | GitHub Actions — 5 checks (lint, typecheck, unit, integration, build) |

---

## Repo Structure

```
/apps
  /mobile          Expo RN app
  /web             Next.js App Router
  /api             Fastify backend
/packages
  /ui              Cross-platform UI primitives (Tamagui components)
  /shared          Types, zod schemas, error model, permissions, audit definitions
  /app             Shared screens + Solito linking/navigation wrappers
  /db              Drizzle schema + migrations
/docs
  /architecture    Split architecture docs
```

### Directory rules

- Web route files `apps/web/app/**/page.tsx` re-export screens from `@innera/app`. Protected routes wrap screens with `RequireAuth` from `@innera/app`.
- Shared screens live in `/packages/app/src/screens`.
- Shared components (e.g. `ScreenContainer`, `RequireAuth`, `ErrorBoundary`) live in `/packages/app/src/components`.
- UI primitives live in `/packages/ui/src/components` — all built on Tamagui.
- Platform-specific implementations use file suffix: `auth.native.ts`, `auth.web.ts`.

### Tamagui setup

```
/packages/ui
  /src
    /tamagui.config.ts    tokens, themes (light/dark), media queries
    /components
      /Button.tsx          <Button> built on Tamagui <styled()>
      /Input.tsx
      /Card.tsx
      ...
```

- `tamagui.config.ts` defines spacing, color, radius, and font tokens.
- Themes: `light` (warm backgrounds: `warmWhite`, `warmGray50`, `warmGray100`) and `dark` with semantic color mappings.
- Semantic tokens include `primary`, `secondary`, `danger`, `success`, `warning`, `error`, `info`, `headerWarm`, `colorSubtle`.
- `colorSubtle` targets WCAG AA+ contrast (~7.5:1 in light, adequate in dark).
- All components use `styled()` from Tamagui — zero raw `StyleSheet.create`.
- Components: `Button`, `Card`, `Input`, `Text` (+ `Heading`, `Caption`, `Label`), `Badge`, `IconBadge`, `StatCard`, `EmptyState`.
- Web: Tamagui compiler extracts static CSS at build time via `@tamagui/next-plugin`.
- Mobile: Tamagui runs natively on RN.
- **SSR hydration:** The `Provider` in `packages/app/src/provider/index.tsx` defers `useColorScheme()` until after mount via a `mounted` flag to prevent server/client theme mismatch (server has no `window.matchMedia`). Trade-off: brief light→dark flash for dark-mode users.

---

## Next.js Universal React Config

`apps/web/next.config.js` MUST:

```js
const { withTamagui } = require('@tamagui/next-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'react-native',
    'react-native-web',
    'solito',
    'expo-linking',
    'expo-modules-core',
    '@innera/ui',
    '@innera/app',
    '@innera/shared',
    'tamagui',
    '@tamagui/core',
    '@tamagui/config',
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
    };
    config.resolve.extensions = [
      '.web.tsx', '.web.ts', '.web.js',
      ...config.resolve.extensions,
    ];
    return config;
  },
};

module.exports = withTamagui({
  config: '../../packages/ui/src/tamagui.config.ts',
  components: ['tamagui', '@innera/ui'],
  appDir: true,
  outputCSS: './public/tamagui.css',
  ...nextConfig,
});
```
