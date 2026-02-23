import type { FastifyPluginAsync } from 'fastify';
import authRoutes from './auth.js';
import entriesRoutes from './entries.js';
import partnerRoutes from './partner.js';
import circlesRoutes from './circles.js';
import notificationsRoutes from './notifications.js';
import settingsRoutes from './settings.js';
import usersRoutes from './users.js';
import attachmentsRoutes from './attachments.js';
import importExportRoutes from './import-export.js';
import accountRoutes from './account.js';
import pushTokensRoutes from './push-tokens.js';
import commentsRoutes from './comments.js';
import reactionsRoutes from './reactions.js';

/**
 * Barrel plugin that registers all v1 route modules under the /v1 prefix.
 * Each module encapsulates its own route definitions and schema validation.
 */
const v1Routes: FastifyPluginAsync = async (app) => {
  await app.register(authRoutes);
  await app.register(entriesRoutes);
  await app.register(partnerRoutes);
  await app.register(circlesRoutes);
  await app.register(notificationsRoutes);
  await app.register(settingsRoutes);
  await app.register(usersRoutes);
  await app.register(attachmentsRoutes);
  await app.register(importExportRoutes);
  await app.register(accountRoutes);
  await app.register(pushTokensRoutes);
  await app.register(commentsRoutes);
  await app.register(reactionsRoutes);
};

export default v1Routes;
