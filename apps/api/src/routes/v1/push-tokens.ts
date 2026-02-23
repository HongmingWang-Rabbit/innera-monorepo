import type { FastifyPluginAsync } from 'fastify';
import { registerPushTokenSchema } from '@innera/shared';
import { authenticate } from '../../middleware/auth.js';

const pushTokensRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /v1/push-tokens
   * Register a push notification token for the authenticated user's current device.
   */
  app.post('/push-tokens', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    const body = registerPushTokenSchema.parse(request.body);
    void body;
    // TODO: register push token
    return reply.status(201).send({
      statusCode: 201,
      data: { message: 'TODO' },
    });
  });

  /**
   * DELETE /v1/push-tokens/:token
   * Deregister a push notification token (e.g. on logout or permission revoked).
   */
  app.delete<{ Params: { token: string } }>('/push-tokens/:token', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 1, maxLength: 512 },
        },
      },
    },
  }, async (request, reply) => {
    void request.user;
    const { token } = request.params;
    void token;
    // TODO: deregister push token
    return reply.status(204).send();
  });
};

export default pushTokensRoutes;
