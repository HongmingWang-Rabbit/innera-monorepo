import type { FastifyPluginAsync } from 'fastify';
import { createCommentSchema, paginationSchema } from '@innera/shared';
import { authenticate } from '../../middleware/auth.js';

const commentsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/entries/:entryId/comments
   * List comments on a journal entry (cursor-paginated).
   */
  app.get<{ Params: { entryId: string } }>('/entries/:entryId/comments', {
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
    const query = paginationSchema.parse(request.query);
    void query;
    // TODO: fetch comments
    return reply.status(200).send({
      statusCode: 200,
      data: [],
      pagination: { nextCursor: null, hasMore: false, limit: query.limit },
    });
  });

  /**
   * POST /v1/entries/:entryId/comments
   * Add a comment to a journal entry.
   */
  app.post<{ Params: { entryId: string } }>('/entries/:entryId/comments', {
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
    const body = createCommentSchema.parse(request.body);
    void body;
    // TODO: create comment
    return reply.status(201).send({
      statusCode: 201,
      data: { message: 'TODO' },
    });
  });

  /**
   * DELETE /v1/entries/:entryId/comments/:commentId
   * Delete a comment (owner or entry author only).
   */
  app.delete<{ Params: { entryId: string; commentId: string } }>('/entries/:entryId/comments/:commentId', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['entryId', 'commentId'],
        properties: {
          entryId: { type: 'string', format: 'uuid' },
          commentId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    void request.user;
    const { entryId, commentId } = request.params;
    void entryId;
    void commentId;
    // TODO: delete comment
    return reply.status(204).send();
  });
};

export default commentsRoutes;
