import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/auth.js';

const accountRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /v1/account/delete
   * Schedule account deletion. A 30-day grace period applies before data is purged.
   */
  app.post('/account/delete', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    // TODO: schedule account deletion
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * POST /v1/account/delete/cancel
   * Cancel a scheduled account deletion within the grace period.
   */
  app.post('/account/delete/cancel', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    // TODO: cancel scheduled deletion
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * GET /v1/account/delete/status
   * Check whether the account has a pending scheduled deletion.
   */
  app.get('/account/delete/status', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    // TODO: check deletion status
    return reply.status(200).send({
      statusCode: 200,
      data: { scheduled: false },
    });
  });
};

export default accountRoutes;
