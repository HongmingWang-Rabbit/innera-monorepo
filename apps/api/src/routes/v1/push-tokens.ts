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
    return reply.status(501).send({
      statusCode: 501,
      code: 'NOT_IMPLEMENTED',
      message: 'Push token registration deferred to post-MVP',
    });
  });

  /**
   * DELETE /v1/push-tokens
   * Deregister a push notification token (e.g. on logout or permission revoked).
   * Token is passed in the request body to avoid logging sensitive tokens in URLs.
   */
  app.delete('/push-tokens', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    const body = registerPushTokenSchema.parse(request.body);
    void body;
    // TODO: deregister push token
    return reply.status(501).send({
      statusCode: 501,
      code: 'NOT_IMPLEMENTED',
      message: 'Push token deregistration deferred to post-MVP',
    });
  });
};

export default pushTokensRoutes;
