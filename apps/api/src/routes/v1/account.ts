import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/auth.js';

const accountRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /v1/account/delete
   * Schedule account deletion. A 7-day grace period applies before data is purged.
   */
  app.post('/account/delete', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    // TODO: schedule account deletion
    return reply.status(501).send({
      statusCode: 501,
      code: 'NOT_IMPLEMENTED',
      message: 'Account deletion deferred to post-MVP',
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
    return reply.status(501).send({
      statusCode: 501,
      code: 'NOT_IMPLEMENTED',
      message: 'Account deletion cancellation deferred to post-MVP',
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
    return reply.status(501).send({
      statusCode: 501,
      code: 'NOT_IMPLEMENTED',
      message: 'Deletion status check deferred to post-MVP',
    });
  });
};

export default accountRoutes;
