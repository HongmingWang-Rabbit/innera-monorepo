import type { FastifyPluginAsync } from 'fastify';
import { eq, and, isNull } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import {
  googleAuthSchema,
  appleAuthSchema,
  refreshTokenSchema,
  AppError,
  Errors,
} from '@innera/shared';
import { db, users, authIdentities, userSettings } from '@innera/db';
import { authenticate } from '../../middleware/auth.js';
import { exchangeGoogleCode, exchangeAppleCode } from '../../services/oauth.js';
import {
  generateTokenPair,
  verifyRefreshToken,
  atomicRevokeRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
} from '../../services/token.js';

async function findOrCreateUser(
  provider: 'google' | 'apple',
  profile: { email: string; providerUserId: string; rawProfile: Record<string, unknown> },
) {
  return db.transaction(async (tx) => {
    // Check if auth identity already exists
    const existing = await tx
      .select({ userId: authIdentities.userId })
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.provider, provider),
          eq(authIdentities.providerUserId, profile.providerUserId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      const user = await tx
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(and(eq(users.id, existing[0]!.userId), isNull(users.deletedAt)))
        .limit(1);

      if (user.length === 0) throw Errors.unauthorized('Authentication failed');
      return user[0]!;
    }

    // Validate and sanitize OAuth profile data
    const rawName = profile.rawProfile['name'];
    const sanitizedName = typeof rawName === 'string' ? rawName.slice(0, 100) : null;

    const rawPicture = profile.rawProfile['picture'];
    const sanitizedPicture =
      typeof rawPicture === 'string' && rawPicture.startsWith('https://') ? rawPicture : null;

    // Create new user + identity + settings
    const salt = randomBytes(32);
    const [newUser] = await tx.insert(users).values({
      email: profile.email,
      displayName: sanitizedName,
      avatarUrl: sanitizedPicture,
      encryptionSalt: salt,
    }).returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    });

    const [identity] = await tx.insert(authIdentities).values({
      userId: newUser!.id,
      provider,
      providerUserId: profile.providerUserId,
      email: profile.email,
      rawProfile: profile.rawProfile,
    })
    .onConflictDoNothing({ target: [authIdentities.provider, authIdentities.providerUserId] })
    .returning();

    // If conflict occurred (concurrent insert), re-fetch the existing identity+user
    // and clean up the orphaned user row we just created
    if (!identity) {
      // Delete the orphaned user that was just inserted (has no auth identity pointing to it)
      await tx.delete(users).where(eq(users.id, newUser!.id));

      const [existingIdentity] = await tx
        .select({ userId: authIdentities.userId })
        .from(authIdentities)
        .where(
          and(
            eq(authIdentities.provider, provider),
            eq(authIdentities.providerUserId, profile.providerUserId),
          ),
        )
        .limit(1);

      if (!existingIdentity) throw new AppError('INTERNAL_ERROR', 500, 'Failed to create or find auth identity');

      const [existingUser] = await tx
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(and(eq(users.id, existingIdentity.userId), isNull(users.deletedAt)))
        .limit(1);

      if (!existingUser) throw Errors.unauthorized('Authentication failed');
      return existingUser;
    }

    await tx.insert(userSettings).values({
      userId: newUser!.id,
    });

    return newUser!;
  });
}

function buildAuthResponse(
  tokens: { accessToken: string; refreshToken: string; expiresIn: number },
  user: { id: string; email: string; displayName: string | null; avatarUrl: string | null },
) {
  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
  };
}

const authRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /v1/auth/google/code
   */
  app.post('/auth/google/code', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const body = googleAuthSchema.parse(request.body);
    const profile = await exchangeGoogleCode(body.code, body.codeVerifier, body.redirectUri);
    const user = await findOrCreateUser('google', profile);
    const tokens = await generateTokenPair(app.redis, user);

    return reply.status(200).send({
      statusCode: 200,
      data: buildAuthResponse(tokens, user),
    });
  });

  /**
   * POST /v1/auth/apple/code
   */
  app.post('/auth/apple/code', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const body = appleAuthSchema.parse(request.body);
    const profile = await exchangeAppleCode(body.code, body.identityToken, body.redirectUri);
    const user = await findOrCreateUser('apple', profile);
    const tokens = await generateTokenPair(app.redis, user);

    return reply.status(200).send({
      statusCode: 200,
      data: buildAuthResponse(tokens, user),
    });
  });

  /**
   * POST /v1/auth/refresh
   */
  app.post('/auth/refresh', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const body = refreshTokenSchema.parse(request.body);

    let claims: { sub: string; jti: string };
    try {
      claims = await verifyRefreshToken(body.refreshToken);
    } catch {
      throw new AppError('UNAUTHORIZED', 401, 'Invalid refresh token');
    }

    // Atomically revoke old token — prevents race conditions in concurrent refresh requests
    const wasValid = await atomicRevokeRefreshToken(app.redis, claims.sub, claims.jti);
    if (!wasValid) throw new AppError('UNAUTHORIZED', 401, 'Refresh token has been revoked');

    // Get user
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(and(eq(users.id, claims.sub), isNull(users.deletedAt)))
      .limit(1);

    if (!user) throw new AppError('UNAUTHORIZED', 401, 'User not found');

    const tokens = await generateTokenPair(app.redis, user);

    return reply.status(200).send({
      statusCode: 200,
      data: {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  });

  /**
   * GET /v1/auth/me
   */
  app.get('/auth/me', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.id, request.user!.id), isNull(users.deletedAt)))
      .limit(1);

    if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');

    return reply.status(200).send({
      statusCode: 200,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
      },
    });
  });

  /**
   * POST /v1/auth/logout
   */
  app.post('/auth/logout', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
    preHandler: [authenticate],
  }, async (request, reply) => {
    // Best-effort: try to extract JTI from the refresh token in body
    // But this endpoint mainly just clears server-side session
    const body = refreshTokenSchema.safeParse(request.body);
    if (body.success && body.data.refreshToken) {
      try {
        const claims = await verifyRefreshToken(body.data.refreshToken);
        await revokeRefreshToken(app.redis, request.user!.id, claims.jti);
      } catch {
        // Token already expired/invalid — that's fine
      }
    }
    return reply.status(204).send();
  });

  /**
   * POST /v1/auth/logout-all
   */
  app.post('/auth/logout-all', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
    preHandler: [authenticate],
  }, async (request, reply) => {
    await revokeAllRefreshTokens(app.redis, request.user!.id);
    return reply.status(204).send();
  });
};

export default authRoutes;
