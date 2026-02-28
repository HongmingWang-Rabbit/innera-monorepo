import type { FastifyPluginAsync } from 'fastify';
import { eq, and, lt, desc, sql, inArray } from 'drizzle-orm';
import { paginationSchema, AppError } from '@innera/shared';
import { db, notifications } from '@innera/db';
import { authenticate } from '../../middleware/auth.js';
import { decodeCursor, buildPaginatedResponse } from '../../services/pagination.js';

function notificationToResponse(n: typeof notifications.$inferSelect) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    read: n.read,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  };
}

const notificationsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/notifications
   */
  app.get('/notifications', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const { cursor, limit } = paginationSchema.parse(request.query);
    const cursorDate = decodeCursor(cursor);

    const conditions = [eq(notifications.userId, request.user!.id)];
    if (cursorDate) conditions.push(lt(notifications.createdAt, cursorDate));

    const rows = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1);

    const result = buildPaginatedResponse(rows, limit, (row) => row.createdAt);

    return reply.status(200).send({
      statusCode: 200,
      data: result.data.map(notificationToResponse),
      pagination: result.pagination,
    });
  });

  /**
   * GET /v1/notifications/unread-count
   */
  app.get('/notifications/unread-count', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, request.user!.id),
          eq(notifications.read, false),
        ),
      );

    return reply.status(200).send({
      statusCode: 200,
      data: { count: result?.count ?? 0 },
    });
  });

  /**
   * POST /v1/notifications/:id/read
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
    const { id } = request.params;

    const result = await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, request.user!.id),
        ),
      )
      .returning();

    if (result.length === 0) throw new AppError('NOT_FOUND', 404, 'Notification not found');

    return reply.status(200).send({
      statusCode: 200,
      data: notificationToResponse(result[0]!),
    });
  });

  /**
   * POST /v1/notifications/read-all
   */
  app.post('/notifications/read-all', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    // Process in batches to avoid locking too many rows at once
    const BATCH_SIZE = 500;
    let totalUpdated = 0;
    let batchCount: number;

    do {
      // Select a batch of unread notification IDs
      const batch = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, request.user!.id),
            eq(notifications.read, false),
          ),
        )
        .limit(BATCH_SIZE);

      batchCount = batch.length;
      if (batchCount === 0) break;

      await db
        .update(notifications)
        .set({ read: true, readAt: new Date() })
        .where(inArray(notifications.id, batch.map((b) => b.id)));

      totalUpdated += batchCount;
    } while (batchCount === BATCH_SIZE);

    return reply.status(200).send({
      statusCode: 200,
      data: { success: true, updated: totalUpdated },
    });
  });
};

export default notificationsRoutes;
