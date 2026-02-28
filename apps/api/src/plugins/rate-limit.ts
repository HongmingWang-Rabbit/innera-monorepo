import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';

export default fp(
  async function rateLimitPlugin(app: FastifyInstance) {
    await app.register(rateLimit, {
      global: true,
      max: 300,
      timeWindow: '1 minute',
      redis: app.redis,
      keyGenerator: (request: FastifyRequest) => {
        return request.ip;
      },
      addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
      },
      addHeadersOnExceeding: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
      },
      errorResponseBuilder: (_request, context) => ({
        statusCode: 429,
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded. Try again in ${Math.max(1, Math.ceil(context.ttl / 1000))} seconds.`,
        retryAfter: Math.max(1, Math.ceil(context.ttl / 1000)),
      }),
    });
  },
  { name: 'rate-limit-plugin', dependencies: ['redis-plugin'] },
);
