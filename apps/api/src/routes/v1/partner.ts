import type { FastifyPluginAsync } from 'fastify';
import { partnerRespondSchema } from '@innera/shared';
import { authenticate } from '../../middleware/auth.js';

const partnerRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/partner
   * Get the current user's active partner link (if any).
   */
  app.get('/partner', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    // TODO: fetch partner link
    return reply.status(200).send({
      statusCode: 200,
      data: null,
    });
  });

  /**
   * POST /v1/partner/invite
   * Generate a partner invite link / code.
   */
  app.post('/partner/invite', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    // TODO: generate partner invite
    return reply.status(201).send({
      statusCode: 201,
      data: { message: 'TODO' },
    });
  });

  /**
   * POST /v1/partner/invite/:code/accept
   * Accept a partner invite using the invite code.
   */
  app.post<{ Params: { code: string } }>('/partner/invite/:code/accept', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', minLength: 1, maxLength: 64 },
        },
      },
    },
  }, async (request, reply) => {
    void request.user;
    const { code } = request.params;
    void code;
    // TODO: accept partner invite
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * POST /v1/partner/respond
   * Accept or decline a pending partner request.
   */
  app.post('/partner/respond', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    const body = partnerRespondSchema.parse(request.body);
    void body;
    // TODO: respond to partner request
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * DELETE /v1/partner
   * Unlink the current partner relationship.
   */
  app.delete('/partner', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    // TODO: unlink partner
    return reply.status(204).send();
  });
};

export default partnerRoutes;
