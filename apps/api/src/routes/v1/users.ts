import type { FastifyPluginAsync } from 'fastify';
import { eq, and, isNull } from 'drizzle-orm';
import { updateUserSchema, AppError } from '@innera/shared';
import { db, users } from '@innera/db';
import { authenticate } from '../../middleware/auth.js';

const usersRoutes: FastifyPluginAsync = async (app) => {
  /**
   * PATCH /v1/users/me
   */
  app.patch('/users/me', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const body = updateUserSchema.parse(request.body);

    const [updated] = await db
      .update(users)
      .set({ displayName: body.displayName, avatarUrl: body.avatarUrl })
      .where(and(eq(users.id, request.user!.id), isNull(users.deletedAt)))
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      });

    if (!updated) throw new AppError('NOT_FOUND', 404, 'User not found');

    return reply.status(200).send({
      statusCode: 200,
      data: {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        avatarUrl: updated.avatarUrl,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  });
};

export default usersRoutes;
