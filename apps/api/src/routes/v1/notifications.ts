import type { FastifyPluginAsync } from 'fastify';
import { paginationSchema } from '@innera/shared';
import { authenticate } from '../../middleware/auth.js';

const notificationsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/notifications
   * List notifications for the authenticated user (cursor-paginated).
   */
  app.get('/notifications', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    const query = paginationSchema.parse(request.query);
    void query;
    // TODO: fetch notifications
    return reply.status(200).send({
      statusCode: 200,
      data: [],
      pagination: { nextCursor: null, hasMore: false, limit: query.limit },
    });
  });

  /**
   * GET /v1/notifications/unread-count
   * Return the number of unread notifications for the authenticated user.
   */
  app.get('/notifications/unread-count', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    // TODO: count unread notifications
    return reply.status(200).send({
      statusCode: 200,
      data: { count: 0 },
    });
  });

  /**
   * POST /v1/notifications/:id/read
   * Mark a single notification as read.
   */
  app.post<{ Params: { id: string } }>('/notifications/:id/read', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    void request.user;
    const { id } = request.params;
    void id;
    // TODO: mark notification as read
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * POST /v1/notifications/read-all
   * Mark all notifications as read for the authenticated user.
   */
  app.post('/notifications/read-all', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    // TODO: mark all notifications as read
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });
};

export default notificationsRoutes;
