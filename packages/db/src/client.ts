import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from './schema';

// ---- Helpers ----

function safeParseInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

// ---- Lazy-initialized singleton ----
// The pool and db are created on first access, not at import time.
// This allows schema-only imports (e.g. drizzle-kit generate) to work
// without requiring DATABASE_URL to be set.

let _pool: Pool | null = null;
let _db: NodePgDatabase<typeof schema> | null = null;

function createPool(): Pool {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
        'Please set it to a valid PostgreSQL connection string (e.g. postgresql://user:password@host:5432/dbname).',
    );
  }

  if (!DATABASE_URL.startsWith('postgres://') && !DATABASE_URL.startsWith('postgresql://')) {
    throw new Error(
      'DATABASE_URL must be a valid PostgreSQL connection string starting with "postgres://" or "postgresql://".',
    );
  }

  const newPool = new Pool({
    connectionString: DATABASE_URL,
    max: safeParseInt(process.env.DB_POOL_MAX, 20),
    min: safeParseInt(process.env.DB_POOL_MIN, 2),
    idleTimeoutMillis: safeParseInt(process.env.DB_IDLE_TIMEOUT_MS, 30000),
    connectionTimeoutMillis: safeParseInt(process.env.DB_CONNECTION_TIMEOUT_MS, 5000),
    // SSL defaults:
    // - Explicitly set DB_SSL='true' -> SSL enabled
    // - Explicitly set DB_SSL='false' -> SSL disabled
    // - Not set + NODE_ENV='production' -> SSL enabled (safe default for production)
    // - Not set + other environments -> SSL disabled (convenient for local dev)
    ssl:
      process.env.DB_SSL === 'false'
        ? false
        : process.env.DB_SSL === 'true' || (!process.env.DB_SSL && process.env.NODE_ENV === 'production')
          ? { rejectUnauthorized: process.env['DB_SSL_REJECT_UNAUTHORIZED'] !== 'false' }
          : false,
  });

  // TODO: Accept an injected logger (e.g. Pino) so pool errors flow through structured logging.
  newPool.on('error', (err) => {
    console.error('[innera/db] Unexpected idle-client error in PostgreSQL pool:', err.message || err);
  });

  if (process.env.DEBUG) {
    newPool.on('connect', () => {
      console.debug('New DB pool connection established');
    });
  }

  return newPool;
}

// ---- Public accessors ----

/**
 * Returns the shared connection pool. Creates it lazily on first access.
 */
export function getPool(): Pool {
  if (!_pool) {
    _pool = createPool();
  }
  return _pool;
}

/**
 * Returns the shared Drizzle ORM instance. Creates it lazily on first access.
 */
export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

/** Lazily-initialized PostgreSQL connection pool (Proxy for backwards compatibility) */
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    return Reflect.get(getPool(), prop, receiver);
  },
});

/** Lazily-initialized Drizzle ORM instance (Proxy for backwards compatibility) */
export const db: NodePgDatabase<typeof schema> = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

// ---- Health check ----

export async function checkDbHealth(): Promise<boolean> {
  try {
    // Use a transaction so SET LOCAL scopes the timeout to this transaction only,
    // avoiding the need for a RESET and preventing leaked settings on the connection.
    const drizzleDb = getDb();
    await drizzleDb.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL statement_timeout = 5000`);
      await tx.execute(sql`SELECT 1`);
    });
    return true;
  } catch {
    return false;
  }
}

// ---- Graceful shutdown ----

export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
}
