import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { updateSettingsSchema, AppError } from '@innera/shared';
import { db, userSettings } from '@innera/db';
import { authenticate } from '../../middleware/auth.js';

function settingsToResponse(s: typeof userSettings.$inferSelect) {
  return {
    theme: s.theme,
    notifyPartner: s.notifyPartner,
    notifyCircle: s.notifyCircle,
    notifyComments: s.notifyComments,
    notifyReactions: s.notifyReactions,
    defaultVisibility: s.defaultVisibility,
    locale: s.locale,
    timezone: s.timezone,
  };
}

const settingsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/settings
   */
  app.get('/settings', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const userId = request.user!.id;

    // Atomic upsert: insert defaults if missing, return existing if present
    const [upserted] = await db
      .insert(userSettings)
      .values({ userId })
      .onConflictDoNothing({ target: userSettings.userId })
      .returning();

    if (upserted) {
      return reply.status(200).send({ statusCode: 200, data: settingsToResponse(upserted) });
    }

    // Row already existed — fetch it
    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!existing) throw new AppError('INTERNAL_ERROR', 500, 'Failed to retrieve settings');
    return reply.status(200).send({ statusCode: 200, data: settingsToResponse(existing) });
  });

  /**
   * PATCH /v1/settings
   */
  app.patch('/settings', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const body = updateSettingsSchema.parse(request.body);

    const [settings] = await db
      .insert(userSettings)
      .values({
        userId: request.user!.id,
        ...body,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: body,
      })
      .returning();

    return reply.status(200).send({
      statusCode: 200,
      data: settingsToResponse(settings!),
    });
  });
};

export default settingsRoutes;
