import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/auth.js';

const importExportRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /v1/export
   * Request a full data export for the authenticated user.
   * Processing is async -- the export file is delivered via push notification or email.
   */
  app.post('/export', {
    preHandler: [authenticate],
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    void request.user;
    // TODO: start export job
    return reply.status(501).send({
      statusCode: 501,
      code: 'NOT_IMPLEMENTED',
      message: 'Export/import deferred to post-MVP',
    });
  });

  /**
   * GET /v1/export/:jobId/status
   * Poll the status of a pending export job.
   */
  app.get<{ Params: { jobId: string } }>('/export/:jobId/status', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['jobId'],
        properties: {
          jobId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    void request.user;
    const { jobId } = request.params;
    void jobId;
    // TODO: check export job status
    return reply.status(501).send({
      statusCode: 501,
      code: 'NOT_IMPLEMENTED',
      message: 'Export/import deferred to post-MVP',
    });
  });

  /**
   * POST /v1/import
   * Import journal entries from an exported data archive.
   * Accepts multipart form data with a single `file` field.
   */
  app.post('/import', {
    preHandler: [authenticate],
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    void request.user;
    // TODO: start import job
    return reply.status(501).send({
      statusCode: 501,
      code: 'NOT_IMPLEMENTED',
      message: 'Export/import deferred to post-MVP',
    });
  });

  /**
   * GET /v1/import/:jobId/status
   * Poll the status of a pending import job.
   */
  app.get<{ Params: { jobId: string } }>('/import/:jobId/status', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['jobId'],
        properties: {
          jobId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    void request.user;
    const { jobId } = request.params;
    void jobId;
    // TODO: check import job status
    return reply.status(501).send({
      statusCode: 501,
      code: 'NOT_IMPLEMENTED',
      message: 'Export/import deferred to post-MVP',
    });
  });
};

export default importExportRoutes;
