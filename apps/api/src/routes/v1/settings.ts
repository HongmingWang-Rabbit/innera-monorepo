import type { FastifyPluginAsync } from 'fastify';
import { updateSettingsSchema } from '@innera/shared';
import { authenticate } from '../../middleware/auth.js';

const settingsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/settings
   * Get the authenticated user's application settings.
   */
  app.get('/settings', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    // TODO: fetch settings
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * PATCH /v1/settings
   * Update the authenticated user's application settings.
   */
  app.patch('/settings', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    const body = updateSettingsSchema.parse(request.body);
    void body;
    // TODO: update settings
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });
};

export default settingsRoutes;
