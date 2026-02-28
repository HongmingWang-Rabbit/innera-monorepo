# 2. Auth

> Section 4 of the architecture doc.

---

## Providers

| Provider | Flow | Notes |
|----------|------|-------|
| **Google OAuth** | Authorization Code + PKCE | Backend exchanges code, validates `id_token` audience |
| **Apple Sign-In** | Authorization Code | Backend validates `id_token` via Apple JWKS; handles `email` relay |

## Guest Mode (No Login Required)

Users can use the app without any authentication for local-only journaling:

```
┌─────────────────────────────────────────────┐
│  App Launch                                  │
│  ├─ "Continue as Guest" → local-only mode    │
│  │   • Entries stored in local SQLite/MMKV   │
│  │   • No sync, no sharing, no circles       │
│  │   • Banner: "Sign in to sync & share"     │
│  │                                           │
│  └─ "Sign in" → Google / Apple OAuth         │
│      • Full features unlocked                │
│      • Offer to import local guest entries   │
└─────────────────────────────────────────────┘
```

**Guest → Authenticated migration:**
When a guest signs in, prompt: "Import X local entries to your account?" If yes, encrypt and upload. If no, local entries remain local.

## Route-Level Auth Guards

Not all screens require authentication. The `RequireAuth` component (`packages/app/src/components/RequireAuth.tsx`) wraps protected screens and shows a sign-in prompt for unauthenticated/guest users.

| Route | Auth required? | Notes |
|-------|---------------|-------|
| `/` (Home) | No | Shows empty state when not authenticated |
| `/entry/*` (New, Detail, Edit) | No | Writing entries works without login |
| `/settings` | No | Handles guest state internally (banner + defaults) |
| `/login` | No | Login page itself |
| `/circles`, `/circles/[id]` | **Yes** | Wrapped with `RequireAuth` |
| `/partner` | **Yes** | Wrapped with `RequireAuth` |
| `/notifications` | **Yes** | Wrapped with `RequireAuth` |

**React Query hooks** also gate on auth status: all query hooks use `enabled: status === 'authenticated' && !isGuest` to prevent API calls from firing without a valid token. Mutations (create, update, delete) are not gated — they rely on call-site guards or API-level 401 responses.

**RequireAuth behavior:**
- `status === 'loading'` → shows `Spinner`
- `status === 'unauthenticated'` or `isGuest` → shows a `Card` with lock icon, contextual message, and "Sign In" button (uses `router.replace` to avoid back-button loops)
- `status === 'authenticated'` and not guest → renders children

## Token Strategy

```
Access Token:  JWT, 15 min TTL, signed with RS256
Refresh Token: opaque, 30 day TTL, stored in Redis with userId
               rotation on every use (old token invalidated)

Mobile: tokens returned as JSON { accessToken, refreshToken }
Web:    accessToken in memory, refreshToken in httpOnly secure SameSite=Lax cookie
```

**Refresh token storage:** Tokens are stored in Redis as SHA-256 hashes, never raw. The client holds the raw token; the server computes `SHA-256(refreshToken)` and uses that as the Redis key (`rt:{hash}`). This ensures a Redis data leak (backup, MONITOR command) does not expose usable tokens.

**CSRF protection (web):** The `SameSite=Lax` attribute on the refresh token cookie prevents CSRF attacks on state-changing POST endpoints. Cross-origin requests from attacker sites will not include the cookie. This is the primary CSRF defense; CORS provides an additional layer.

## Session Revocation

- `POST /auth/logout` deletes refresh token from Redis.
- `POST /auth/logout-all` deletes ALL refresh tokens for the user.
- Access tokens are short-lived (15 min) — no blacklist needed at MVP.
- Future: if needed, maintain a Redis-based JWT blacklist with TTL = remaining JWT life.

## Routes

```
POST /v1/auth/google/code    { code, codeVerifier?, redirectUri }
POST /v1/auth/apple/code     { code, identityToken, redirectUri }
POST /v1/auth/refresh         { refreshToken }     (mobile) / cookie (web)
GET  /v1/auth/me
POST /v1/auth/logout
POST /v1/auth/logout-all
```

## auth_identities design (multi-provider)

A single `users` row can have multiple `auth_identities`:
```
users:           id=1, displayName="Hongming"
auth_identities: userId=1, provider='google', providerUserId='google-sub-123'
auth_identities: userId=1, provider='apple',  providerUserId='apple-sub-456'
```

If a user signs in with Apple and then later signs in with Google using the same email, offer account linking (require confirmation).

**Apple email relay note:** Apple Sign-In may use a private relay email (e.g., `abc123@privaterelay.appleid.com`). Users can revoke relay access in their Apple ID settings, making the relay email undeliverable. Therefore: use `providerUserId` (the `sub` claim) as the primary identity key, never rely on email alone for account matching, and handle email delivery failures gracefully (e.g., skip sending if relay email bounces).
