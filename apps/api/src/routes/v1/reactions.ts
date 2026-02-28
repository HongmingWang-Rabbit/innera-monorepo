import type { FastifyPluginAsync } from 'fastify';
import { eq, and, sql } from 'drizzle-orm';
import { createReactionSchema, AppError } from '@innera/shared';
import { db, reactions } from '@innera/db';
import { authenticate } from '../../middleware/auth.js';
import { createNotification } from '../../services/notification.js';
import { getAndVerifyEntryAccess } from '../../services/entry-access.js';

const PG_UNIQUE_VIOLATION = '23505';

function reactionToResponse(r: typeof reactions.$inferSelect) {
  return {
    id: r.id,
    entryId: r.entryId,
    userId: r.userId,
    emoji: r.emoji,
    createdAt: r.createdAt.toISOString(),
  };
}

const reactionsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/entries/:entryId/reactions
   */
  app.get<{ Params: { entryId: string } }>('/entries/:entryId/reactions', {
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

    // Verify entry exists and user has access
    await getAndVerifyEntryAccess(entryId, userId);

    // Return reactions grouped by emoji with counts, plus individual reactions (limited)
    const MAX_REACTIONS = 500;
    const rows = await db
      .select()
      .from(reactions)
      .where(eq(reactions.entryId, entryId))
      .limit(MAX_REACTIONS + 1);

    const hasMore = rows.length > MAX_REACTIONS;
    const data = hasMore ? rows.slice(0, MAX_REACTIONS) : rows;

    return reply.status(200).send({
      statusCode: 200,
      data: data.map(reactionToResponse),
      pagination: { hasMore, limit: MAX_REACTIONS },
    });
  });

  /**
   * POST /v1/entries/:entryId/reactions
   */
  app.post<{ Params: { entryId: string } }>('/entries/:entryId/reactions', {
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
    const body = createReactionSchema.parse(request.body);

    // Verify entry exists and user has access
    const entry = await getAndVerifyEntryAccess(entryId, userId);

    // Idempotent insert — if same user+entry+emoji exists, return existing
    try {
      const [reaction] = await db.insert(reactions).values({
        entryId,
        userId,
        emoji: body.emoji,
      }).returning();

      // Notify entry author if reactor is different (fire-and-forget)
      if (entry.authorId !== userId) {
        createNotification({
          userId: entry.authorId,
          type: 'REACTION_ADDED',
          title: 'New reaction on your entry',
          body: `Someone reacted with ${body.emoji}`,
          data: { entryId, reactionId: reaction!.id },
        }).catch((err) => request.log.warn({ err }, 'Failed to create reaction notification'));
      }

      return reply.status(201).send({
        statusCode: 201,
        data: reactionToResponse(reaction!),
      });
    } catch (err: unknown) {
      // Unique constraint violation — reaction already exists
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === PG_UNIQUE_VIOLATION) {
        const [existing] = await db
          .select()
          .from(reactions)
          .where(
            and(
              eq(reactions.entryId, entryId),
              eq(reactions.userId, userId),
              eq(reactions.emoji, body.emoji),
            ),
          )
          .limit(1);

        return reply.status(200).send({
          statusCode: 200,
          data: existing ? reactionToResponse(existing) : null,
        });
      }
      throw err;
    }
  });

  /**
   * DELETE /v1/entries/:entryId/reactions/:reactionId
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
    const { entryId, reactionId } = request.params;
    const userId = request.user!.id;

    // Hard delete: reactions table has no deletedAt column by design.
    // Unlike comments (which use soft delete for audit trails), reactions are
    // lightweight toggles with no content worth preserving.
    const result = await db
      .delete(reactions)
      .where(and(eq(reactions.id, reactionId), eq(reactions.userId, userId), eq(reactions.entryId, entryId)))
      .returning({ id: reactions.id });

    if (result.length === 0) throw new AppError('NOT_FOUND', 404, 'Reaction not found or not yours');

    return reply.status(204).send();
  });
};

export default reactionsRoutes;
