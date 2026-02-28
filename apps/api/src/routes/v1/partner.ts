import type { FastifyPluginAsync } from 'fastify';
import { eq, and, or, inArray, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { partnerRespondSchema, AppError } from '@innera/shared';
import { db, partnerLinks, users } from '@innera/db';
import { authenticate } from '../../middleware/auth.js';
import { createNotification } from '../../services/notification.js';

/** Check if a user already has an active or pending partner link */
async function hasExistingPartnerLink(
  userId: string,
  // Accept both the db instance and a transaction — use Pick to avoid the $client mismatch
  txOrDb: Pick<typeof db, 'select'> = db,
): Promise<boolean> {
  const [existing] = await txOrDb
    .select({ id: partnerLinks.id })
    .from(partnerLinks)
    .where(
      and(
        or(eq(partnerLinks.initiatorId, userId), eq(partnerLinks.partnerId, userId)),
        inArray(partnerLinks.status, ['ACTIVE', 'PENDING']),
      ),
    )
    .limit(1);
  return !!existing;
}

const INVITE_PREFIX = 'partner_invite:';
const INVITE_TTL = 24 * 60 * 60; // 24h

function partnerLinkToResponse(
  link: typeof partnerLinks.$inferSelect,
  partner: { id: string; displayName: string | null; avatarUrl: string | null } | null,
  role: 'initiator' | 'partner',
) {
  return {
    id: link.id,
    status: link.status,
    role,
    partner: partner ? {
      id: partner.id,
      displayName: partner.displayName,
      avatarUrl: partner.avatarUrl,
    } : null,
    initiatedAt: link.initiatedAt.toISOString(),
    respondedAt: link.respondedAt?.toISOString() ?? null,
  };
}

const partnerRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/partner
   */
  app.get('/partner', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const userId = request.user!.id;

    // Single query: fetch the partner link and the other user's profile via LEFT JOIN
    // Same table reference for LEFT JOIN — Drizzle handles this since the join condition is unambiguous.
    // If another users join is needed, use Drizzle's aliasedTable() to create a proper alias.
    const otherUser = users;
    const [row] = await db
      .select({
        link: partnerLinks,
        partnerId: otherUser.id,
        partnerDisplayName: otherUser.displayName,
        partnerAvatarUrl: otherUser.avatarUrl,
      })
      .from(partnerLinks)
      .leftJoin(
        otherUser,
        sql`${otherUser.id} = CASE
          WHEN ${partnerLinks.initiatorId} = ${userId} THEN ${partnerLinks.partnerId}
          ELSE ${partnerLinks.initiatorId}
        END`,
      )
      .where(
        and(
          or(eq(partnerLinks.initiatorId, userId), eq(partnerLinks.partnerId, userId)),
          inArray(partnerLinks.status, ['ACTIVE', 'PENDING']),
        ),
      )
      .limit(1);

    if (!row) {
      return reply.status(200).send({ statusCode: 200, data: null });
    }

    const isInitiator = row.link.initiatorId === userId;
    const partner = row.partnerId
      ? { id: row.partnerId, displayName: row.partnerDisplayName, avatarUrl: row.partnerAvatarUrl }
      : null;

    return reply.status(200).send({
      statusCode: 200,
      data: partnerLinkToResponse(row.link, partner, isInitiator ? 'initiator' : 'partner'),
    });
  });

  /**
   * POST /v1/partner/invite
   */
  app.post('/partner/invite', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const userId = request.user!.id;

    // Check for existing active/pending link
    if (await hasExistingPartnerLink(userId)) {
      throw new AppError('CONFLICT', 409, 'You already have an active or pending partner link');
    }

    const code = randomBytes(16).toString('hex');

    // Atomically ensure only one outstanding invite per user via SETNX
    const lockKey = `partner_pending_invite:${userId}`;
    const acquired = await app.redis.set(lockKey, code, 'EX', INVITE_TTL, 'NX');
    if (!acquired) {
      throw new AppError('CONFLICT', 409, 'You already have a pending partner invite');
    }

    await app.redis.set(`${INVITE_PREFIX}${code}`, userId, 'EX', INVITE_TTL);

    return reply.status(201).send({
      statusCode: 201,
      data: { inviteCode: code, expiresIn: INVITE_TTL },
    });
  });

  /**
   * POST /v1/partner/invite/:code/accept
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
    const userId = request.user!.id;
    const { code } = request.params;

    const redisKey = `${INVITE_PREFIX}${code}`;

    // Peek at the invite code first (non-destructive) to validate before consuming
    const initiatorId = await app.redis.get(redisKey);
    if (!initiatorId) throw new AppError('NOT_FOUND', 404, 'Invite code not found or expired');

    // Check self-accept BEFORE consuming the invite to avoid destroying a valid code
    if (initiatorId === userId) throw new AppError('BAD_REQUEST', 400, 'You cannot accept your own invite');

    // Capture remaining TTL before consuming so we can restore with the correct expiry on failure
    const remainingTtl = await app.redis.ttl(redisKey);

    // Atomically consume the invite code to prevent race conditions
    const consumed = await app.redis.getdel(redisKey);
    if (!consumed) throw new AppError('NOT_FOUND', 404, 'Invite code not found or expired');

    // Wrap DB operations in a transaction; restore the Redis invite code on failure
    let link: typeof partnerLinks.$inferSelect;
    try {
      link = await db.transaction(async (tx) => {
        // Check if the accepting user already has an active/pending partner link
        if (await hasExistingPartnerLink(userId, tx)) {
          throw new AppError('CONFLICT', 409, 'You already have an active or pending partner link');
        }

        // Also check if the INITIATOR already has an active/pending link
        // (they may have formed one with someone else since creating the invite)
        if (await hasExistingPartnerLink(initiatorId, tx)) {
          throw new AppError('CONFLICT', 409, 'The inviting user already has an active or pending partner link');
        }

        // Create ACTIVE partner link directly (invite code = implicit consent)
        const [created] = await tx
          .insert(partnerLinks)
          .values({
            initiatorId,
            partnerId: userId,
            status: 'ACTIVE',
            respondedAt: new Date(),
          })
          .returning();

        return created!;
      });
    } catch (err) {
      // Restore the invite code so the initiator can retry or another user can accept
      await app.redis.set(redisKey, initiatorId, 'EX', remainingTtl > 0 ? remainingTtl : INVITE_TTL);
      throw err;
    }

    // Clean up the pending invite lock for the initiator
    await app.redis.del(`partner_pending_invite:${initiatorId}`);

    // Notify the initiator (fire-and-forget — don't fail the request if notification fails)
    createNotification({
      userId: initiatorId,
      type: 'PARTNER_ACCEPTED',
      title: 'Partner request accepted',
      body: 'Your partner invite has been accepted!',
    }).catch((err) => request.log.warn({ err }, 'Failed to create partner accepted notification'));

    return reply.status(200).send({
      statusCode: 200,
      data: { id: link.id, status: 'ACTIVE' },
    });
  });

  /**
   * POST /v1/partner/respond
   */
  app.post('/partner/respond', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const userId = request.user!.id;
    const { accept } = partnerRespondSchema.parse(request.body);

    const [link] = await db
      .select()
      .from(partnerLinks)
      .where(
        and(
          eq(partnerLinks.partnerId, userId),
          eq(partnerLinks.status, 'PENDING'),
        ),
      )
      .limit(1);

    if (!link) throw new AppError('NOT_FOUND', 404, 'No pending partner request found');

    const newStatus = accept ? 'ACTIVE' : 'DECLINED';
    const [updated] = await db
      .update(partnerLinks)
      .set({ status: newStatus, respondedAt: new Date() })
      .where(and(eq(partnerLinks.id, link.id), eq(partnerLinks.status, 'PENDING')))
      .returning({ id: partnerLinks.id });

    if (!updated) throw new AppError('CONFLICT', 409, 'Partner request has already been responded to');

    createNotification({
      userId: link.initiatorId,
      type: accept ? 'PARTNER_ACCEPTED' : 'PARTNER_REVOKED',
      title: accept ? 'Partner request accepted' : 'Partner request declined',
      body: accept ? 'Your partner invite has been accepted!' : 'Your partner invite was declined.',
    }).catch((err) => request.log.warn({ err }, 'Failed to create partner respond notification'));

    return reply.status(200).send({
      statusCode: 200,
      data: { id: link.id, status: newStatus },
    });
  });

  /**
   * DELETE /v1/partner
   */
  app.delete('/partner', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const userId = request.user!.id;

    const [link] = await db
      .select()
      .from(partnerLinks)
      .where(
        and(
          or(eq(partnerLinks.initiatorId, userId), eq(partnerLinks.partnerId, userId)),
          eq(partnerLinks.status, 'ACTIVE'),
        ),
      )
      .limit(1);

    if (!link) throw new AppError('NOT_FOUND', 404, 'No active partner link found');

    const result = await db
      .update(partnerLinks)
      .set({ status: 'REVOKED', revokedAt: new Date(), revokedBy: userId })
      .where(and(eq(partnerLinks.id, link.id), eq(partnerLinks.status, 'ACTIVE')))
      .returning({ id: partnerLinks.id });

    if (result.length === 0) throw new AppError('CONFLICT', 409, 'Partner link has already been revoked');

    const otherUserId = link.initiatorId === userId ? link.partnerId : link.initiatorId;
    createNotification({
      userId: otherUserId,
      type: 'PARTNER_REVOKED',
      title: 'Partner disconnected',
      body: 'Your partner has ended the connection.',
    }).catch((err) => request.log.warn({ err }, 'Failed to create partner revoked notification'));

    return reply.status(204).send();
  });
};

export default partnerRoutes;
