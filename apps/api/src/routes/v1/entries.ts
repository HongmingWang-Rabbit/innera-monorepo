import type { FastifyPluginAsync } from 'fastify';
import { eq, and, isNull, isNotNull, lt, desc, sql } from 'drizzle-orm';
import {
  createEntrySchema,
  updateEntrySchema,
  paginationSchema,
  searchSchema,
  AppError,
} from '@innera/shared';
import { db, entries, circleMemberships } from '@innera/db';
import { authenticate } from '../../middleware/auth.js';
import { decodeCursor, buildPaginatedResponse } from '../../services/pagination.js';

function entryToResponse(entry: typeof entries.$inferSelect) {
  return {
    id: entry.id,
    authorId: entry.authorId,
    contentEncrypted: entry.contentEncrypted.toString('base64'),
    titleEncrypted: entry.titleEncrypted ? entry.titleEncrypted.toString('base64') : null,
    visibility: entry.visibility,
    circleId: entry.circleId,
    mood: entry.mood,
    version: entry.version,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

const entriesRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/entries
   */
  app.get('/entries', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const { cursor, limit } = paginationSchema.parse(request.query);
    const cursorDate = decodeCursor(cursor);

    const conditions = [
      eq(entries.authorId, request.user!.id),
      isNull(entries.deletedAt),
    ];
    if (cursorDate) conditions.push(lt(entries.createdAt, cursorDate));

    const rows = await db
      .select()
      .from(entries)
      .where(and(...conditions))
      .orderBy(desc(entries.createdAt))
      .limit(limit + 1);

    const result = buildPaginatedResponse(rows, limit, (row) => row.createdAt);

    return reply.status(200).send({
      statusCode: 200,
      data: result.data.map(entryToResponse),
      pagination: result.pagination,
    });
  });

  /**
   * POST /v1/entries
   */
  app.post('/entries', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const body = createEntrySchema.parse(request.body);

    // Verify circle membership when posting to a circle
    if (body.circleId && (body.visibility === 'CIRCLE' || body.visibility === 'FUTURE_CIRCLE_ONLY')) {
      const [membership] = await db
        .select({ id: circleMemberships.id })
        .from(circleMemberships)
        .where(
          and(
            eq(circleMemberships.circleId, body.circleId),
            eq(circleMemberships.userId, request.user!.id),
            eq(circleMemberships.status, 'ACTIVE'),
          ),
        )
        .limit(1);
      if (!membership) throw new AppError('FORBIDDEN', 403, 'You are not an active member of this circle');
    }

    const [entry] = await db.insert(entries).values({
      authorId: request.user!.id,
      contentEncrypted: Buffer.from(body.contentEncrypted, 'base64'),
      titleEncrypted: body.titleEncrypted ? Buffer.from(body.titleEncrypted, 'base64') : null,
      visibility: body.visibility,
      circleId: body.circleId ?? null,
      mood: body.mood ?? null,
    }).returning();

    return reply.status(201).send({
      statusCode: 201,
      data: entryToResponse(entry!),
    });
  });

  /**
   * GET /v1/entries/search
   */
  app.get('/entries/search', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const { q, cursor, limit } = searchSchema.parse(request.query);
    const cursorDate = decodeCursor(cursor);
    const escapedQ = q.replace(/[%_\\]/g, '\\$&');

    // MVP: search on mood field only (content is encrypted).
    // Explicit ESCAPE clause ensures the backslash escapes are interpreted correctly.
    const conditions = [
      eq(entries.authorId, request.user!.id),
      isNull(entries.deletedAt),
      sql`${entries.mood} ILIKE ${'%' + escapedQ + '%'} ESCAPE '\\'`,
    ];
    if (cursorDate) conditions.push(lt(entries.createdAt, cursorDate));

    const rows = await db
      .select()
      .from(entries)
      .where(and(...conditions))
      .orderBy(desc(entries.createdAt))
      .limit(limit + 1);

    const result = buildPaginatedResponse(rows, limit, (row) => row.createdAt);

    return reply.status(200).send({
      statusCode: 200,
      data: result.data.map(entryToResponse),
      pagination: result.pagination,
    });
  });

  /**
   * GET /v1/entries/:id
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
    const { id } = request.params;

    const [entry] = await db
      .select()
      .from(entries)
      .where(and(eq(entries.id, id), eq(entries.authorId, request.user!.id), isNull(entries.deletedAt)))
      .limit(1);

    if (!entry) throw new AppError('NOT_FOUND', 404, 'Entry not found');

    return reply.status(200).send({
      statusCode: 200,
      data: entryToResponse(entry),
    });
  });

  /**
   * PATCH /v1/entries/:id
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
    const { id } = request.params;
    const body = updateEntrySchema.parse(request.body);

    // Verify circle membership when changing visibility to a circle
    if (body.circleId && (body.visibility === 'CIRCLE' || body.visibility === 'FUTURE_CIRCLE_ONLY')) {
      const [membership] = await db
        .select({ id: circleMemberships.id })
        .from(circleMemberships)
        .where(
          and(
            eq(circleMemberships.circleId, body.circleId),
            eq(circleMemberships.userId, request.user!.id),
            eq(circleMemberships.status, 'ACTIVE'),
          ),
        )
        .limit(1);
      if (!membership) throw new AppError('FORBIDDEN', 403, 'You are not an active member of this circle');
    }

    const updated = await db
      .update(entries)
      .set({
        contentEncrypted: body.contentEncrypted !== undefined
          ? Buffer.from(body.contentEncrypted, 'base64')
          : undefined,
        titleEncrypted: body.titleEncrypted !== undefined
          ? (body.titleEncrypted ? Buffer.from(body.titleEncrypted, 'base64') : null)
          : undefined,
        visibility: body.visibility,
        circleId: body.circleId !== undefined ? body.circleId : undefined,
        mood: body.mood !== undefined ? body.mood : undefined,
        version: sql`${entries.version} + 1`,
      })
      .where(
        and(
          eq(entries.id, id),
          eq(entries.authorId, request.user!.id),
          eq(entries.version, body.version),
          isNull(entries.deletedAt),
        ),
      )
      .returning();

    if (updated.length === 0) {
      // Check if entry exists but version mismatch
      const [exists] = await db
        .select({ id: entries.id })
        .from(entries)
        .where(and(eq(entries.id, id), eq(entries.authorId, request.user!.id), isNull(entries.deletedAt)))
        .limit(1);

      if (!exists) throw new AppError('NOT_FOUND', 404, 'Entry not found');
      throw new AppError('CONFLICT', 409, 'Entry has been modified. Please refresh and try again.');
    }

    return reply.status(200).send({
      statusCode: 200,
      data: entryToResponse(updated[0]!),
    });
  });

  /**
   * DELETE /v1/entries/:id
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
    const { id } = request.params;

    const result = await db
      .update(entries)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(entries.id, id),
          eq(entries.authorId, request.user!.id),
          isNull(entries.deletedAt),
        ),
      )
      .returning({ id: entries.id });

    if (result.length === 0) throw new AppError('NOT_FOUND', 404, 'Entry not found');

    return reply.status(204).send();
  });

  /**
   * POST /v1/entries/:id/restore
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
    const { id } = request.params;

    const result = await db
      .update(entries)
      .set({ deletedAt: null })
      .where(
        and(
          eq(entries.id, id),
          eq(entries.authorId, request.user!.id),
          isNotNull(entries.deletedAt),
        ),
      )
      .returning();

    if (result.length === 0) throw new AppError('NOT_FOUND', 404, 'Entry not found or not deleted');

    return reply.status(200).send({
      statusCode: 200,
      data: entryToResponse(result[0]!),
    });
  });
};

export default entriesRoutes;
