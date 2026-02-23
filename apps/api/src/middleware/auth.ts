import { jwtVerify } from 'jose';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '@innera/shared';

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

let cachedSecret: Uint8Array | undefined;

function getJwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}

async function verifyToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    algorithms: ['HS256'],
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
    throw new AppError('UNAUTHORIZED', 401, 'Authorization header missing or malformed');
  }

  try {
    request.user = await verifyToken(token);
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError('UNAUTHORIZED', 401, 'Invalid or expired token');
  }
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

  try {
    request.user = await verifyToken(token);
  } catch {
    // Invalid or expired token -- silently set user to undefined
    request.user = undefined;
  }
}
