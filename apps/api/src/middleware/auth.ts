import { jwtVerify } from 'jose';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { AppError } from '@innera/shared';
import { db, users } from '@innera/db';
import { getJwtSecret } from '../services/jwt-secret.js';

// ---- Module augmentation ----

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export interface AuthUser {
  id: string;
  email: string;
}

// ---- Helpers ----

async function verifyToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    audience: 'access',
    issuer: 'innera-api',
  });

  const id = payload['sub'];
  const email = payload['email'];

  if (typeof id !== 'string' || !id) {
    throw new AppError('UNAUTHORIZED', 401, 'Invalid token: missing sub claim');
  }
  if (typeof email !== 'string' || !email) {
    throw new AppError('UNAUTHORIZED', 401, 'Invalid token: missing email claim');
  }

  return { id, email };
}

function extractBearerToken(request: FastifyRequest): string | null {
  const authHeader = request.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice('Bearer '.length).trim() || null;
}

// ---- preHandler hooks ----

/**
 * Requires a valid JWT. Attaches `request.user` or throws 401.
 */
export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const token = extractBearerToken(request);

  if (!token) {
    request.log.debug('Auth failed: no bearer token provided');
    throw new AppError('UNAUTHORIZED', 401, 'Authorization header missing or malformed');
  }

  let authUser: AuthUser;
  try {
    authUser = await verifyToken(token);
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError('UNAUTHORIZED', 401, 'Invalid or expired token');
  }

  // Verify user exists and is not soft-deleted.
  // Trade-off: this DB query runs on every authenticated request, adding ~1-2ms
  // of latency. This is intentional — it ensures soft-deleted or removed users
  // are locked out immediately rather than remaining active until token expiry.
  // If this becomes a bottleneck, consider a short-lived Redis cache (e.g. 60s TTL)
  // keyed by user ID, accepting a brief window where deleted users retain access.
  const [user] = await db
    .select({ id: users.id, email: users.email, deletedAt: users.deletedAt })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!user) {
    throw new AppError('UNAUTHORIZED', 401, 'User not found');
  }
  if (user.deletedAt) {
    throw new AppError('UNAUTHORIZED', 401, 'Account has been deleted');
  }

  // Use fresh DB data instead of potentially stale JWT claims
  request.user = { id: user.id, email: user.email };
}

/**
 * Optionally verifies a JWT. Attaches `request.user` if valid; does not throw
 * if no token or token is invalid -- just sets user to undefined.
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const token = extractBearerToken(request);
  if (!token) {
    request.user = undefined;
    return;
  }

  let authUser: AuthUser;
  try {
    authUser = await verifyToken(token);
  } catch (err) {
    request.log.debug({ err }, 'Optional auth: token verification failed');
    request.user = undefined;
    return;
  }

  // Verify user exists and is not soft-deleted
  try {
    const [user] = await db
      .select({ id: users.id, email: users.email, deletedAt: users.deletedAt })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (!user || user.deletedAt) {
      request.user = undefined;
      return;
    }

    // Use fresh DB data instead of potentially stale JWT claims
    request.user = { id: user.id, email: user.email };
  } catch (err) {
    request.log.debug({ err }, 'Optional auth: user lookup failed');
    request.user = undefined;
  }
}
