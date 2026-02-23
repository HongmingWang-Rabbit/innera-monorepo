import type { FastifyPluginAsync } from 'fastify';
import {
  createCircleSchema,
  updateCircleSchema,
  joinCircleSchema,
  transferAdminSchema,
} from '@innera/shared';
import { authenticate } from '../../middleware/auth.js';

const circlesRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/circles
   * List all circles the authenticated user belongs to.
   */
  app.get('/circles', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    // TODO: fetch circles
    return reply.status(200).send({
      statusCode: 200,
      data: [],
    });
  });

  /**
   * POST /v1/circles
   * Create a new circle. The creator becomes the first admin.
   */
  app.post('/circles', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    const body = createCircleSchema.parse(request.body);
    void body;
    // TODO: create circle
    return reply.status(201).send({
      statusCode: 201,
      data: { message: 'TODO' },
    });
  });

  /**
   * GET /v1/circles/:id
   * Get a single circle's details (members, settings, etc.).
   */
  app.get<{ Params: { id: string } }>('/circles/:id', {
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
    // TODO: fetch circle
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * PATCH /v1/circles/:id
   * Update circle metadata (admin only).
   */
  app.patch<{ Params: { id: string } }>('/circles/:id', {
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
    const body = updateCircleSchema.parse(request.body);
    void body;
    // TODO: update circle
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * DELETE /v1/circles/:id
   * Dissolve a circle (admin only). Soft-deletes the circle and removes all members.
   */
  app.delete<{ Params: { id: string } }>('/circles/:id', {
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
    // TODO: dissolve circle
    return reply.status(204).send();
  });

  /**
   * POST /v1/circles/join
   * Join a circle using an invite code.
   */
  app.post('/circles/join', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    const body = joinCircleSchema.parse(request.body);
    void body;
    // TODO: join circle
    return reply.status(201).send({
      statusCode: 201,
      data: { message: 'TODO' },
    });
  });

  /**
   * POST /v1/circles/:id/invite
   * Generate a new invite link / code for the circle (admin only).
   */
  app.post<{ Params: { id: string } }>('/circles/:id/invite', {
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
    // TODO: generate invite
    return reply.status(201).send({
      statusCode: 201,
      data: { message: 'TODO' },
    });
  });

  /**
   * GET /v1/circles/:id/join-requests
   * List pending join requests for a circle (admin only).
   */
  app.get<{ Params: { id: string } }>('/circles/:id/join-requests', {
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
    // TODO: list join requests
    return reply.status(200).send({
      statusCode: 200,
      data: [],
    });
  });

  /**
   * POST /v1/circles/:id/join-requests/:requestId/approve
   * Approve a member's join request (admin only).
   */
  app.post<{ Params: { id: string; requestId: string } }>('/circles/:id/join-requests/:requestId/approve', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id', 'requestId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          requestId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    void request.user;
    const { id, requestId } = request.params;
    void id;
    void requestId;
    // TODO: approve join request
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * POST /v1/circles/:id/join-requests/:requestId/reject
   * Reject a member's join request (admin only).
   */
  app.post<{ Params: { id: string; requestId: string } }>('/circles/:id/join-requests/:requestId/reject', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id', 'requestId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          requestId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    void request.user;
    const { id, requestId } = request.params;
    void id;
    void requestId;
    // TODO: reject join request
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * DELETE /v1/circles/:id/members/:userId
   * Remove a member from the circle (admin only).
   */
  app.delete<{ Params: { id: string; userId: string } }>('/circles/:id/members/:userId', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id', 'userId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    void request.user;
    const { id, userId } = request.params;
    void id;
    void userId;
    // TODO: remove member
    return reply.status(204).send();
  });

  /**
   * POST /v1/circles/:id/leave
   * Leave a circle (member action).
   */
  app.post<{ Params: { id: string } }>('/circles/:id/leave', {
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
    // TODO: leave circle
    return reply.status(204).send();
  });

  /**
   * POST /v1/circles/:id/transfer-admin
   * Transfer admin rights to another member (admin only).
   */
  app.post<{ Params: { id: string } }>('/circles/:id/transfer-admin', {
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
    const body = transferAdminSchema.parse(request.body);
    void body;
    // TODO: transfer admin
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });
};

export default circlesRoutes;
