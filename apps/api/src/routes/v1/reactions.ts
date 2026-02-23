import type { FastifyPluginAsync } from 'fastify';
import { createReactionSchema } from '@innera/shared';
import { authenticate } from '../../middleware/auth.js';

const reactionsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/entries/:entryId/reactions
   * List emoji reactions on a journal entry.
   */
  app.get<{ Params: { entryId: string } }>('/entries/:entryId/reactions', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['entryId'],
        properties: {
          entryId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    void request.user;
    const { entryId } = request.params;
    void entryId;
    // TODO: fetch reactions
    return reply.status(200).send({
      statusCode: 200,
      data: [],
    });
  });

  /**
   * POST /v1/entries/:entryId/reactions
   * Add an emoji reaction to a journal entry.
   */
  app.post<{ Params: { entryId: string } }>('/entries/:entryId/reactions', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['entryId'],
        properties: {
          entryId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    void request.user;
    const { entryId } = request.params;
    void entryId;
    const body = createReactionSchema.parse(request.body);
    void body;
    // TODO: create reaction
    return reply.status(201).send({
      statusCode: 201,
      data: { message: 'TODO' },
    });
  });

  /**
   * DELETE /v1/entries/:entryId/reactions/:reactionId
   * Remove a specific reaction (owner only).
   */
  app.delete<{ Params: { entryId: string; reactionId: string } }>('/entries/:entryId/reactions/:reactionId', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['entryId', 'reactionId'],
        properties: {
          entryId: { type: 'string', format: 'uuid' },
          reactionId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    void request.user;
    const { entryId, reactionId } = request.params;
    void entryId;
    void reactionId;
    // TODO: delete reaction
    return reply.status(204).send();
  });
};

export default reactionsRoutes;
