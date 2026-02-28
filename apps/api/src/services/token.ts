import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'node:crypto';
import type Redis from 'ioredis';
import { getJwtSecret } from './jwt-secret.js';

const REFRESH_TOKEN_PREFIX = 'refresh_token:';
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const ACCESS_TOKEN_EXPIRY = `${ACCESS_TOKEN_TTL_SECONDS}s`;
const REFRESH_TOKEN_EXPIRY = `${REFRESH_TOKEN_TTL_SECONDS}s`;

export async function generateAccessToken(user: { id: string; email: string }): Promise<string> {
  return new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setAudience('access')
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer('innera-api')
    .sign(getJwtSecret());
}

export async function generateRefreshToken(user: { id: string }): Promise<{ token: string; jti: string }> {
  const jti = randomUUID();
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setAudience('refresh')
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuer('innera-api')
    .sign(getJwtSecret());
  return { token, jti };
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string; jti: string }> {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    audience: 'refresh',
    issuer: 'innera-api',
  });
  const sub = payload['sub'];
  const jti = payload['jti'];
  if (typeof sub !== 'string' || !sub) throw new Error('Invalid refresh token: missing sub');
  if (typeof jti !== 'string' || !jti) throw new Error('Invalid refresh token: missing jti');
  return { sub, jti };
}

export async function storeRefreshToken(redis: Redis, userId: string, jti: string): Promise<void> {
  // Store each JTI as an individual key with its own TTL so that
  // storing a new token does not reset the expiry of existing tokens.
  await redis.set(`${REFRESH_TOKEN_PREFIX}${userId}:${jti}`, '1', 'EX', REFRESH_TOKEN_TTL_SECONDS);
}

export async function isRefreshTokenValid(redis: Redis, userId: string, jti: string): Promise<boolean> {
  return (await redis.exists(`${REFRESH_TOKEN_PREFIX}${userId}:${jti}`)) === 1;
}

export async function revokeRefreshToken(redis: Redis, userId: string, jti: string): Promise<void> {
  await redis.del(`${REFRESH_TOKEN_PREFIX}${userId}:${jti}`);
}

/**
 * Atomically revoke a refresh token, returning whether it was valid.
 * Prevents race conditions where two concurrent refresh requests both pass the validity check.
 */
export async function atomicRevokeRefreshToken(redis: Redis, userId: string, jti: string): Promise<boolean> {
  const result = await redis.eval(
    'if redis.call("del", KEYS[1]) == 1 then return 1 else return 0 end',
    1,
    `${REFRESH_TOKEN_PREFIX}${userId}:${jti}`,
  );
  return result === 1;
}

export async function revokeAllRefreshTokens(redis: Redis, userId: string): Promise<void> {
  // SCAN for all keys matching the user's prefix and delete them in batches
  const pattern = `${REFRESH_TOKEN_PREFIX}${userId}:*`;
  let cursor = '0';
  const MAX_SCAN_ITERATIONS = 100;
  let iterations = 0;
  do {
    if (++iterations > MAX_SCAN_ITERATIONS) {
      // Safety valve: stop scanning to prevent blocking Redis for too long
      break;
    }
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== '0');

  if (iterations >= MAX_SCAN_ITERATIONS) {
    console.warn(
      `[token] revokeAllRefreshTokens: safety valve hit after ${MAX_SCAN_ITERATIONS} SCAN iterations for userId=${userId}. Some tokens may not have been revoked.`,
    );
  }
}

export async function generateTokenPair(
  redis: Redis,
  user: { id: string; email: string },
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const [accessToken, { token: refreshToken, jti }] = await Promise.all([
    generateAccessToken(user),
    generateRefreshToken(user),
  ]);
  await storeRefreshToken(redis, user.id, jti);
  return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}
