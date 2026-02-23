import type { FastifyPluginAsync } from 'fastify';
import { updateUserSchema } from '@innera/shared';
import { authenticate } from '../../middleware/auth.js';

const usersRoutes: FastifyPluginAsync = async (app) => {
  /**
   * PATCH /v1/users/me
   * Update the authenticated user's public profile (display name, avatar).
   */
  app.patch('/users/me', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    const body = updateUserSchema.parse(request.body);
    void body;
    // TODO: update user profile
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });
};

export default usersRoutes;
