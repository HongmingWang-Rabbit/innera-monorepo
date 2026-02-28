import { randomUUID, randomBytes } from 'node:crypto';
import Fastify, { type FastifyError } from 'fastify';
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
import helmet from '@fastify/helmet';
import { ZodError } from 'zod';
import { AppError } from '@innera/shared';
import { pool } from '@innera/db';

import corsPlugin from './plugins/cors.js';
import rateLimitPlugin from './plugins/rate-limit.js';
import redisPlugin from './plugins/redis.js';
import healthRoutes from './routes/health.js';
import v1Routes from './routes/v1/index.js';

// ---- Environment variable validation ----

function validateEnv(): void {
  // JWT_SECRET is always required regardless of environment
  if (!process.env['JWT_SECRET']) {
    throw new Error(
      'Missing required environment variable: JWT_SECRET. ' +
      'Set this before starting the server.',
    );
  }

  const recommended: Record<string, string | undefined> = {
    DATABASE_URL: process.env['DATABASE_URL'],
    REDIS_URL: process.env['REDIS_URL'],
    CORS_ORIGINS: process.env['CORS_ORIGINS'],
    COOKIE_SECRET: process.env['COOKIE_SECRET'],
  };

  const missing = Object.entries(recommended)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0 && process.env['NODE_ENV'] === 'production') {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Set these before starting the server in production.',
    );
  }

  // Warn in non-production instead of crashing.
  // Uses console.warn because this runs before Fastify/Pino logger is initialized.
  if (missing.length > 0) {
    console.warn(
      `[WARN] Missing environment variables (non-production): ${missing.join(', ')}. ` +
      'Defaults will be used where possible.',
    );
  }

  // JWT_SECRET placeholder & length guard
  const KNOWN_PLACEHOLDERS = ['change-me-to-a-random-64-char-string'];
  const jwtSecret = process.env.JWT_SECRET ?? '';
  if (KNOWN_PLACEHOLDERS.includes(jwtSecret)) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be changed from its placeholder value in production');
    }
    console.warn('[WARN] JWT_SECRET is set to a placeholder value. Change it before deploying.');
  }
  if (jwtSecret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be at least 32 characters for HS256');
    }
    console.warn('[WARN] JWT_SECRET is shorter than 32 characters. Use a longer secret in production.');
  }
}

validateEnv();

// ---- Logger config ----

const REDACTED = '[Redacted]';

const app = Fastify({
  bodyLimit: 1 * 1024 * 1024, // 1 MB global default; attachment routes override with their own limit
  logger: {
    level: process.env['LOG_LEVEL'] ?? 'info',
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-reauth-token"]',
        'req.headers["x-api-key"]',
        'req.body.password',
        'req.body.token',
        'req.body.refreshToken',
        'req.body.accessToken',
        'req.body.identityToken',
        'req.body.secret',
      ],
      censor: REDACTED,
    },
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          hostname: request.hostname,
          remoteAddress: request.ip,
          requestId: request.id,
        };
      },
    },
  },
  genReqId: () => randomUUID(),
  // TRUST_PROXY_HOPS: number of reverse-proxy hops to trust for X-Forwarded-* headers.
  // Set to the number of proxies in front of this service (e.g., 1 for a single load balancer).
  trustProxy: (() => {
    const trustProxyHops = parseInt(process.env['TRUST_PROXY_HOPS'] ?? '0', 10);
    if (isNaN(trustProxyHops) || trustProxyHops < 0) {
      throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
    }
    return trustProxyHops;
  })(),
  ajv: {
    customOptions: {
      strict: 'log',
      coerceTypes: 'array',
      allErrors: false,
    },
  },
});

// ---- Plugin registration ----

await app.register(corsPlugin);
await app.register(helmet, { global: true });
await app.register(cookie, {
  secret: process.env['COOKIE_SECRET'] || randomBytes(32).toString('hex'),
});
await app.register(redisPlugin);
await app.register(rateLimitPlugin);
await app.register(websocket);

// ---- Route registration ----

// Health checks at root level (no /v1 prefix, no auth required)
await app.register(healthRoutes);

// All versioned API routes under /v1
await app.register(v1Routes, { prefix: '/v1' });

// Prevent caching of API responses containing sensitive data
app.addHook('onSend', async (_request, reply) => {
  if (!reply.hasHeader('cache-control')) {
    reply.header('cache-control', 'no-store, no-cache, must-revalidate');
    reply.header('pragma', 'no-cache');
  }
});

// ---- Error handler ----

// Note: handler also processes ZodError and AppError (not just FastifyError)
app.setErrorHandler<FastifyError>((error, request, reply) => {
  // Zod validation errors
  if (error instanceof ZodError) {
    request.log.info({ err: error }, 'Zod validation failed');
    return reply.status(400).send({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      errors: error.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Fastify validation errors
  const fastifyErr = error as FastifyError;
  if (fastifyErr.validation) {
    request.log.info({ err: error }, 'Request validation failed');
    return reply.status(400).send({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      errors: fastifyErr.validation.map((v: { instancePath?: string; schemaPath: string; message?: string }) => ({
        path: v.instancePath || v.schemaPath,
        message: v.message ?? 'Validation failed',
      })),
    });
  }

  // Domain / application errors
  if (error instanceof AppError) {
    request.log.info({ err: error }, 'Application error');
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { errors: error.details } : {}),
    });
  }

  // Rate limit errors from @fastify/rate-limit
  if (fastifyErr.statusCode === 429) {
    return reply.status(429).send({
      statusCode: 429,
      code: 'RATE_LIMITED',
      message: error.message || 'Too many requests',
    });
  }

  // Other Fastify errors with explicit status codes (e.g., 413, 415)
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    request.log.info({ err: error }, 'Fastify client error');
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      code: error.code ?? 'BAD_REQUEST',
      message: error.message,
    });
  }

  // Unexpected errors — log with full stack but don't expose internals
  request.log.error({ err: error }, 'Unhandled error');
  // requestId is intentionally included so callers can reference it in support requests
  return reply.status(500).send({
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong',
    requestId: request.id,
  });
});

// ---- 404 handler ----

app.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    statusCode: 404,
    code: 'NOT_FOUND',
    message: 'Route not found',
  });
});

// ---- Graceful shutdown ----

const SHUTDOWN_TIMEOUT_MS = Math.max(5000, parseInt(process.env['SHUTDOWN_TIMEOUT_MS'] ?? '30000', 10) || 30000);

async function gracefulShutdown(signal: string): Promise<void> {
  app.log.info({ signal }, 'Received shutdown signal, starting graceful shutdown');

  // Hard-kill timeout in case something hangs
  const hardKillTimer = setTimeout(() => {
    app.log.error(`Graceful shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms — forcing exit`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  hardKillTimer.unref();

  try {
    // Stop accepting new connections and wait for in-flight requests to finish
    await app.close();
    app.log.info('Fastify server closed');

    // Close the DB connection pool
    await pool.end();
    app.log.info('Database pool closed');

    clearTimeout(hardKillTimer);
    app.log.info('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    app.log.error({ err }, 'Error during graceful shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => { void gracefulShutdown('SIGTERM'); });
process.on('SIGINT', () => { void gracefulShutdown('SIGINT'); });

// ---- Start server ----

const PORT = Number(process.env['PORT'] ?? 3001);
const HOST = process.env['HOST'] ?? '0.0.0.0';

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info({ port: PORT, host: HOST }, '@innera/api listening');
} catch (err) {
  app.log.fatal({ err }, 'Failed to start server');
  process.exit(1);
}

export { app };
