import type { FastifyPluginAsync } from 'fastify';
import { eq, and, lt, isNull, desc } from 'drizzle-orm';
import { createCommentSchema, paginationSchema, AppError } from '@innera/shared';
import { db, comments, entries } from '@innera/db';
import { authenticate } from '../../middleware/auth.js';
import { decodeCursor, buildPaginatedResponse } from '../../services/pagination.js';
import { createNotification } from '../../services/notification.js';
import { getAndVerifyEntryAccess } from '../../services/entry-access.js';

function commentToResponse(c: typeof comments.$inferSelect) {
  return {
    id: c.id,
    entryId: c.entryId,
    authorId: c.authorId,
    contentEncrypted: c.contentEncrypted.toString('base64'),
    createdAt: c.createdAt.toISOString(),
  };
}

const commentsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/entries/:entryId/comments
   */
  app.get<{ Params: { entryId: string } }>('/entries/:entryId/comments', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['entryId'],
        properties: { entryId: { type: 'string', format: 'uuid' } },
      },
    },
  }, async (request, reply) => {
    const { entryId } = request.params;
    const userId = request.user!.id;
    const { cursor, limit } = paginationSchema.parse(request.query);
    const cursorDate = decodeCursor(cursor);

    // Verify entry exists and user has access
    await getAndVerifyEntryAccess(entryId, userId);

    const conditions = [
      eq(comments.entryId, entryId),
      isNull(comments.deletedAt),
    ];
    if (cursorDate) conditions.push(lt(comments.createdAt, cursorDate));

    const rows = await db
      .select()
      .from(comments)
      .where(and(...conditions))
      .orderBy(desc(comments.createdAt))
      .limit(limit + 1);

    const result = buildPaginatedResponse(rows, limit, (row) => row.createdAt);

    return reply.status(200).send({
      statusCode: 200,
      data: result.data.map(commentToResponse),
      pagination: result.pagination,
    });
  });

  /**
   * POST /v1/entries/:entryId/comments
   */
  app.post<{ Params: { entryId: string } }>('/entries/:entryId/comments', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['entryId'],
        properties: { entryId: { type: 'string', format: 'uuid' } },
      },
    },
  }, async (request, reply) => {
    const { entryId } = request.params;
    const userId = request.user!.id;
    const body = createCommentSchema.parse(request.body);

    // Verify entry exists and user has access
    const entry = await getAndVerifyEntryAccess(entryId, userId);

    const [comment] = await db.insert(comments).values({
      entryId,
      authorId: userId,
      contentEncrypted: Buffer.from(body.contentEncrypted, 'base64'),
    }).returning();

    // Notify entry author if commenter is different (fire-and-forget)
    if (entry.authorId !== userId) {
      createNotification({
        userId: entry.authorId,
        type: 'COMMENT_ADDED',
        title: 'New comment on your entry',
        body: 'Someone commented on your journal entry',
        data: { entryId, commentId: comment!.id },
      }).catch((err) => request.log.warn({ err }, 'Failed to create comment notification'));
    }

    return reply.status(201).send({
      statusCode: 201,
      data: commentToResponse(comment!),
    });
  });

  /**
   * DELETE /v1/entries/:entryId/comments/:commentId
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
    const { entryId, commentId } = request.params;
    const userId = request.user!.id;

    // Check comment exists and user is authorized (comment author or entry author)
    const [comment] = await db
      .select({ authorId: comments.authorId })
      .from(comments)
      .where(and(eq(comments.id, commentId), eq(comments.entryId, entryId), isNull(comments.deletedAt)))
      .limit(1);

    if (!comment) throw new AppError('NOT_FOUND', 404, 'Comment not found');

    const [entry] = await db
      .select({ authorId: entries.authorId })
      .from(entries)
      .where(and(eq(entries.id, entryId), isNull(entries.deletedAt)))
      .limit(1);

    if (comment.authorId !== userId && entry?.authorId !== userId) {
      throw new AppError('FORBIDDEN', 403, 'Only the comment author or entry author can delete this comment');
    }

    // Include isNull(deletedAt) guard for idempotent soft-delete under concurrency
    await db
      .update(comments)
      .set({ deletedAt: new Date() })
      .where(and(eq(comments.id, commentId), isNull(comments.deletedAt)));

    return reply.status(204).send();
  });
};

export default commentsRoutes;
