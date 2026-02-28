import type { FastifyPluginAsync } from 'fastify';
import { eq, and, gt, sql, inArray, desc, isNull } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import {
  createCircleSchema,
  updateCircleSchema,
  joinCircleSchema,
  transferAdminSchema,
  AppError,
} from '@innera/shared';
import { db, circles, circleMemberships, circleInvites } from '@innera/db';
import { authenticate } from '../../middleware/auth.js';

const CIRCLE_INVITE_EXPIRY_DAYS = 30;
const JOIN_INVITE_EXPIRY_DAYS = 7;
const CIRCLE_INVITE_MAX_USES = 100;
const JOIN_INVITE_MAX_USES = 50;

function circleToResponse(c: typeof circles.$inferSelect, memberCount?: number, inviteCode?: string) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    inviteCode: inviteCode ?? null,
    memberCount: memberCount ?? 0,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

async function requireActiveMembership(userId: string, circleId: string, requiredRole?: string) {
  const [membership] = await db
    .select()
    .from(circleMemberships)
    .where(
      and(
        eq(circleMemberships.circleId, circleId),
        eq(circleMemberships.userId, userId),
        eq(circleMemberships.status, 'ACTIVE'),
      ),
    )
    .limit(1);

  if (!membership) throw new AppError('FORBIDDEN', 403, 'You are not an active member of this circle');
  if (requiredRole === 'OWNER' && membership.role !== 'OWNER') {
    throw new AppError('FORBIDDEN', 403, 'Only the circle owner can perform this action');
  }
  return membership;
}

const circlesRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/circles
   */
  app.get('/circles', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const userId = request.user!.id;

    const myMemberships = await db
      .select({ circleId: circleMemberships.circleId })
      .from(circleMemberships)
      .where(and(eq(circleMemberships.userId, userId), eq(circleMemberships.status, 'ACTIVE')));

    if (myMemberships.length === 0) {
      return reply.status(200).send({ statusCode: 200, data: [] });
    }

    const circleIds = myMemberships.map((m) => m.circleId);

    // Use a subquery join instead of correlated subquery to avoid N+1
    const memberCounts = db
      .select({
        circleId: circleMemberships.circleId,
        count: sql<number>`count(*)::int`.as('member_count'),
      })
      .from(circleMemberships)
      .where(eq(circleMemberships.status, 'ACTIVE'))
      .groupBy(circleMemberships.circleId)
      .as('mc');

    const results = await db
      .select({
        circle: circles,
        memberCount: memberCounts.count,
      })
      .from(circles)
      .leftJoin(memberCounts, eq(circles.id, memberCounts.circleId))
      .where(inArray(circles.id, circleIds))
      .orderBy(desc(circles.updatedAt))
      .limit(100);

    return reply.status(200).send({
      statusCode: 200,
      data: results.map((r) => circleToResponse(r.circle, r.memberCount)),
    });
  });

  /**
   * POST /v1/circles
   */
  app.post('/circles', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const userId = request.user!.id;
    const body = createCircleSchema.parse(request.body);
    const inviteCode = randomBytes(8).toString('hex');

    const result = await db.transaction(async (tx) => {
      const [circle] = await tx.insert(circles).values({
        name: body.name,
        description: body.description ?? null,
        createdBy: userId,
      }).returning();

      await tx.insert(circleMemberships).values({
        circleId: circle!.id,
        userId,
        role: 'OWNER',
        status: 'ACTIVE',
        historyPolicy: 'ALL',
      });

      await tx.insert(circleInvites).values({
        circleId: circle!.id,
        invitedBy: userId,
        inviteCode,
        expiresAt: new Date(Date.now() + CIRCLE_INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        maxUses: CIRCLE_INVITE_MAX_USES,
      });

      return circle!;
    });

    return reply.status(201).send({
      statusCode: 201,
      data: circleToResponse(result, 1, inviteCode),
    });
  });

  /**
   * GET /v1/circles/:id
   */
  app.get<{ Params: { id: string } }>('/circles/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    await requireActiveMembership(request.user!.id, id);

    const [result] = await db
      .select({
        circle: circles,
        memberCount: sql<number>`(SELECT count(*)::int FROM circle_memberships cm WHERE cm.circle_id = ${circles.id} AND cm.status = 'ACTIVE')`,
      })
      .from(circles)
      .where(eq(circles.id, id))
      .limit(1);

    if (!result) throw new AppError('NOT_FOUND', 404, 'Circle not found');

    return reply.status(200).send({
      statusCode: 200,
      data: circleToResponse(result.circle, result.memberCount),
    });
  });

  /**
   * PATCH /v1/circles/:id
   */
  app.patch<{ Params: { id: string } }>('/circles/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    await requireActiveMembership(request.user!.id, id, 'OWNER');
    const body = updateCircleSchema.parse(request.body);

    const [updated] = await db
      .update(circles)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      })
      .where(eq(circles.id, id))
      .returning();

    if (!updated) throw new AppError('NOT_FOUND', 404, 'Circle not found');

    return reply.status(200).send({
      statusCode: 200,
      data: circleToResponse(updated),
    });
  });

  /**
   * DELETE /v1/circles/:id
   */
  app.delete<{ Params: { id: string } }>('/circles/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    await requireActiveMembership(request.user!.id, id, 'OWNER');

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.update(circles).set({ status: 'ARCHIVED' }).where(eq(circles.id, id));
      await tx
        .update(circleMemberships)
        .set({ status: 'LEFT', leftAt: now })
        .where(and(eq(circleMemberships.circleId, id), eq(circleMemberships.status, 'ACTIVE')));
      // Expire all active invite codes for this circle
      await tx
        .update(circleInvites)
        .set({ expiresAt: now })
        .where(and(eq(circleInvites.circleId, id), gt(circleInvites.expiresAt, now)));
    });

    return reply.status(204).send();
  });

  /**
   * POST /v1/circles/join
   */
  app.post('/circles/join', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const userId = request.user!.id;
    const body = joinCircleSchema.parse(request.body);

    const inviteCode = body.inviteCode;

    const result = await db.transaction(async (tx) => {
      // Find the invite first without incrementing usedCount
      const [invite] = await tx
        .select()
        .from(circleInvites)
        .where(and(
          eq(circleInvites.inviteCode, inviteCode),
          sql`${circleInvites.usedCount} < ${circleInvites.maxUses}`,
          gt(circleInvites.expiresAt, new Date()),
        ))
        .limit(1);

      if (!invite) {
        throw new AppError('BAD_REQUEST', 400, 'Invalid or expired invite code');
      }

      // Check circle is still active
      const [circle] = await tx
        .select()
        .from(circles)
        .where(eq(circles.id, invite.circleId))
        .limit(1);

      if (!circle || circle.status !== 'ACTIVE') {
        throw new AppError('BAD_REQUEST', 400, 'This circle is no longer active');
      }

      // Enforce maxMembers limit
      const [countRow] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(circleMemberships)
        .where(and(eq(circleMemberships.circleId, invite.circleId), eq(circleMemberships.status, 'ACTIVE')));

      if ((countRow?.count ?? 0) >= circle.maxMembers) {
        throw new AppError('CONFLICT', 409, 'This circle has reached its maximum member limit');
      }

      // Check for any existing membership (active, left, or removed)
      const [existingMembership] = await tx
        .select()
        .from(circleMemberships)
        .where(
          and(
            eq(circleMemberships.circleId, invite.circleId),
            eq(circleMemberships.userId, userId),
          ),
        )
        .limit(1);

      let membership;
      if (existingMembership) {
        if (existingMembership.status === 'ACTIVE') {
          throw new AppError('CONFLICT', 409, 'You are already a member of this circle');
        }
        // Re-activate previously left/removed membership
        const [reactivated] = await tx
          .update(circleMemberships)
          .set({
            status: 'ACTIVE',
            role: 'MEMBER',
            historyPolicy: body.historyPolicy,
            leftAt: null,
          })
          .where(eq(circleMemberships.id, existingMembership.id))
          .returning();
        membership = reactivated;
      } else {
        const [created] = await tx.insert(circleMemberships).values({
          circleId: invite.circleId,
          userId,
          role: 'MEMBER',
          status: 'ACTIVE',
          historyPolicy: body.historyPolicy,
        }).returning();
        membership = created;
      }

      if (!membership) {
        throw new AppError('INTERNAL_ERROR', 500, 'Failed to create membership');
      }

      // Atomically increment usedCount with CAS guard
      const [updated] = await tx.update(circleInvites)
        .set({ usedCount: sql`${circleInvites.usedCount} + 1` })
        .where(and(
          eq(circleInvites.id, invite.id),
          sql`${circleInvites.usedCount} < ${circleInvites.maxUses}`,
        ))
        .returning({ id: circleInvites.id });

      if (!updated) {
        throw new AppError('CONFLICT', 409, 'Invite code has reached its maximum uses');
      }

      return circleToResponse(circle);
    });

    return reply.status(201).send({
      statusCode: 201,
      data: result,
    });
  });

  /**
   * POST /v1/circles/:id/invite
   */
  app.post<{ Params: { id: string } }>('/circles/:id/invite', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    await requireActiveMembership(request.user!.id, id, 'OWNER');

    const inviteCode = randomBytes(8).toString('hex');
    const expirySeconds = JOIN_INVITE_EXPIRY_DAYS * 24 * 60 * 60;
    await db.insert(circleInvites).values({
      circleId: id,
      invitedBy: request.user!.id,
      inviteCode,
      expiresAt: new Date(Date.now() + expirySeconds * 1000),
      maxUses: JOIN_INVITE_MAX_USES,
    });

    return reply.status(201).send({
      statusCode: 201,
      data: { inviteCode, expiresIn: expirySeconds },
    });
  });

  /**
   * GET /v1/circles/:id/join-requests — stub (deferred)
   */
  app.get<{ Params: { id: string } }>('/circles/:id/join-requests', {
    preHandler: [authenticate],
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } } },
  }, async (request, reply) => {
    await requireActiveMembership(request.user!.id, request.params.id, 'OWNER');
    return reply.status(200).send({ statusCode: 200, data: [] });
  });

  /**
   * POST /v1/circles/:id/join-requests/:requestId/approve — stub
   */
  app.post<{ Params: { id: string; requestId: string } }>('/circles/:id/join-requests/:requestId/approve', {
    preHandler: [authenticate],
    schema: { params: { type: 'object', required: ['id', 'requestId'], properties: { id: { type: 'string', format: 'uuid' }, requestId: { type: 'string', format: 'uuid' } } } },
  }, async (_request, reply) => {
    return reply.status(501).send({ statusCode: 501, code: 'NOT_IMPLEMENTED', message: 'Join request approval deferred to post-MVP' });
  });

  /**
   * POST /v1/circles/:id/join-requests/:requestId/reject — stub
   */
  app.post<{ Params: { id: string; requestId: string } }>('/circles/:id/join-requests/:requestId/reject', {
    preHandler: [authenticate],
    schema: { params: { type: 'object', required: ['id', 'requestId'], properties: { id: { type: 'string', format: 'uuid' }, requestId: { type: 'string', format: 'uuid' } } } },
  }, async (_request, reply) => {
    return reply.status(501).send({ statusCode: 501, code: 'NOT_IMPLEMENTED', message: 'Join request rejection deferred to post-MVP' });
  });

  /**
   * DELETE /v1/circles/:id/members/:userId
   */
  app.delete<{ Params: { id: string; userId: string } }>('/circles/:id/members/:userId', {
    preHandler: [authenticate],
    schema: { params: { type: 'object', required: ['id', 'userId'], properties: { id: { type: 'string', format: 'uuid' }, userId: { type: 'string', format: 'uuid' } } } },
  }, async (request, reply) => {
    const { id, userId: targetUserId } = request.params;
    await requireActiveMembership(request.user!.id, id, 'OWNER');
    if (targetUserId === request.user!.id) throw new AppError('BAD_REQUEST', 400, 'Cannot remove yourself. Use the leave endpoint instead.');

    const result = await db
      .update(circleMemberships)
      .set({ status: 'REMOVED', leftAt: new Date() })
      .where(
        and(
          eq(circleMemberships.circleId, id),
          eq(circleMemberships.userId, targetUserId),
          eq(circleMemberships.status, 'ACTIVE'),
        ),
      )
      .returning({ id: circleMemberships.id });

    if (result.length === 0) throw new AppError('NOT_FOUND', 404, 'Member not found in circle');

    return reply.status(204).send();
  });

  /**
   * POST /v1/circles/:id/leave
   */
  app.post<{ Params: { id: string } }>('/circles/:id/leave', {
    preHandler: [authenticate],
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } } },
  }, async (request, reply) => {
    const { id } = request.params;
    const membership = await requireActiveMembership(request.user!.id, id);

    if (membership.role === 'OWNER') {
      throw new AppError('BAD_REQUEST', 400, 'Owner cannot leave. Transfer ownership first or delete the circle.');
    }

    await db
      .update(circleMemberships)
      .set({ status: 'LEFT', leftAt: new Date() })
      .where(eq(circleMemberships.id, membership.id));

    return reply.status(204).send();
  });

  /**
   * POST /v1/circles/:id/transfer-ownership
   */
  app.post<{ Params: { id: string } }>('/circles/:id/transfer-ownership', {
    preHandler: [authenticate],
    schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } } },
  }, async (request, reply) => {
    const { id } = request.params;
    const currentMembership = await requireActiveMembership(request.user!.id, id, 'OWNER');
    const body = transferAdminSchema.parse(request.body);

    const [target] = await db
      .select()
      .from(circleMemberships)
      .where(
        and(
          eq(circleMemberships.circleId, id),
          eq(circleMemberships.userId, body.newAdminUserId),
          eq(circleMemberships.status, 'ACTIVE'),
        ),
      )
      .limit(1);

    if (!target) throw new AppError('NOT_FOUND', 404, 'Target user is not an active member');

    await db.transaction(async (tx) => {
      await tx.update(circleMemberships).set({ role: 'MEMBER' }).where(eq(circleMemberships.id, currentMembership.id));
      await tx.update(circleMemberships).set({ role: 'OWNER' }).where(eq(circleMemberships.id, target.id));
    });

    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'Ownership transferred successfully' },
    });
  });
};

export default circlesRoutes;
