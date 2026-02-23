import type { FastifyPluginAsync } from 'fastify';
import {
  createEntrySchema,
  updateEntrySchema,
  paginationSchema,
  searchSchema,
} from '@innera/shared';
import { authenticate } from '../../middleware/auth.js';

const entriesRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/entries
   * List journal entries for the authenticated user (cursor-paginated).
   */
  app.get('/entries', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    const query = paginationSchema.parse(request.query);
    void query;
    // TODO: fetch paginated entries
    return reply.status(200).send({
      statusCode: 200,
      data: [],
      pagination: { nextCursor: null, hasMore: false, limit: query.limit },
    });
  });

  /**
   * POST /v1/entries
   * Create a new journal entry.
   */
  app.post('/entries', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    const body = createEntrySchema.parse(request.body);
    void body;
    // TODO: create entry
    return reply.status(201).send({
      statusCode: 201,
      data: { message: 'TODO' },
    });
  });

  /**
   * GET /v1/entries/search
   * Full-text search over the authenticated user's entries.
   * Must be registered before /:id to avoid route conflicts.
   */
  app.get('/entries/search', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    const query = searchSchema.parse(request.query);
    void query;
    // TODO: search entries
    return reply.status(200).send({
      statusCode: 200,
      data: [],
      pagination: { nextCursor: null, hasMore: false, limit: query.limit },
    });
  });

  /**
   * GET /v1/entries/:id
   * Fetch a single entry by ID.
   */
  app.get<{ Params: { id: string } }>('/entries/:id', {
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
    // TODO: fetch entry by id
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * PATCH /v1/entries/:id
   * Update an entry. Requires `version` for optimistic concurrency / conflict detection.
   */
  app.patch<{ Params: { id: string } }>('/entries/:id', {
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
    const body = updateEntrySchema.parse(request.body);
    void body;
    // TODO: update entry
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * DELETE /v1/entries/:id
   * Soft-delete an entry.
   */
  app.delete<{ Params: { id: string } }>('/entries/:id', {
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
    // TODO: soft-delete entry
    return reply.status(204).send();
  });

  /**
   * POST /v1/entries/:id/restore
   * Restore a soft-deleted entry.
   */
  app.post<{ Params: { id: string } }>('/entries/:id/restore', {
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
    // TODO: restore entry
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });
};

export default entriesRoutes;
