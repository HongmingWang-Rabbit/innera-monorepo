import fp from 'fastify-plugin';
import Redis from 'ioredis';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default fp(
  async function redisPlugin(app: FastifyInstance) {
    const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';

    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy(times: number) {
        if (times > 10) {
          app.log.error('Redis: max retry attempts reached, giving up');
          return null; // stop retrying
        }
        const delay = Math.min(times * 200, 5000);
        app.log.warn({ attempt: times, delay }, 'Redis: retrying connection');
        return delay;
      },
      reconnectOnError(err: Error) {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return targetErrors.some((e) => err.message.includes(e));
      },
    });

    redis.on('error', (err) => {
      app.log.error({ err }, 'Redis client error');
    });

    redis.on('connect', () => {
      app.log.info('Redis connected');
    });

    redis.on('close', () => {
      app.log.warn('Redis connection closed');
    });

    try {
      await redis.connect();
    } catch (err) {
      app.log.warn({ err }, 'Redis initial connection failed — health check will surface it');
    }

    app.decorate('redis', redis);

    app.addHook('onClose', async () => {
      app.log.info('Disconnecting Redis');
      await redis.quit();
    });
  },
  { name: 'redis-plugin' },
);
