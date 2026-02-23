import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

// ---- Environment variable validation ----

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

// ---- Connection pool setup ----

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX ?? '20', 10),
  min: parseInt(process.env.DB_POOL_MIN ?? '5', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS ?? '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS ?? '5000', 10),
  ssl:
    process.env.DB_SSL === 'false'
      ? false
      : process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : false,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});

if (process.env.DEBUG) {
  pool.on('connect', () => {
    console.debug('New DB pool connection established');
  });
}

// ---- Health check ----

export async function checkDbHealth(): Promise<boolean> {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('DB health check failed:', err instanceof Error ? err.message : err);
    return false;
  } finally {
    client?.release();
  }
}

// ---- Graceful shutdown ----

export async function closePool(): Promise<void> {
  await pool.end();
}

export const db = drizzle(pool, { schema });
export { pool };
