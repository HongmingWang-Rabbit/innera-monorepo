import type { FastifyPluginAsync } from 'fastify';
import { checkDbHealth } from '@innera/db';

const healthRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /health
   * Basic liveness check — always returns 200 if the process is running.
   */
  app.get('/health', {
    schema: {
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async (_request, _reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  });

  /**
   * GET /health/ready
   * Readiness check — verifies DB and Redis connectivity.
   * Returns 503 if any dependency is unavailable.
   */
  app.get('/health/ready', {
    schema: {
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            db: { type: 'string' },
            redis: { type: 'string' },
          },
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            db: { type: 'string' },
            redis: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const [dbOk, redisOk] = await Promise.all([
      checkDbHealth(),
      checkRedisHealth(app),
    ]);

    const dbStatus = dbOk ? 'connected' : 'unavailable';
    const redisStatus = redisOk ? 'connected' : 'unavailable';

    if (!dbOk || !redisOk) {
      request.log.error({ dbOk, redisOk }, 'Readiness check failed');
      return reply.status(503).send({
        status: 'error',
        db: dbStatus,
        redis: redisStatus,
      });
    }

    return {
      status: 'ok',
      db: dbStatus,
      redis: redisStatus,
    };
  });
};

async function checkRedisHealth(app: { redis?: { ping(): Promise<string> } }): Promise<boolean> {
  try {
    if (!app.redis) return false;
    const result = await app.redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

export default healthRoutes;
