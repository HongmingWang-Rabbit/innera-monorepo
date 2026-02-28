/**
 * Shared JWT secret accessor. Single source of truth used by both
 * token generation (services/token.ts) and verification (middleware/auth.ts).
 */

let cachedSecret: Uint8Array | null = null;

export function getJwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = process.env['JWT_SECRET'];
  if (!raw) throw new Error('JWT_SECRET environment variable is required');
  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}
