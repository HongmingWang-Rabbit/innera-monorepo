import type { FastifyPluginAsync } from 'fastify';
import { presignAttachmentSchema, confirmAttachmentSchema } from '@innera/shared';
import { authenticate } from '../../middleware/auth.js';

const attachmentsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /v1/attachments/presign
   * Generate a pre-signed upload URL for an attachment.
   * The client uploads directly to object storage using this URL.
   */
  app.post('/attachments/presign', {
    preHandler: [authenticate],
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    void request.user;
    const body = presignAttachmentSchema.parse(request.body);
    void body;
    // TODO: generate presigned URL
    return reply.status(501).send({
      statusCode: 501,
      code: 'NOT_IMPLEMENTED',
      message: 'Attachment presigning deferred to post-MVP',
    });
  });

  /**
   * POST /v1/attachments/confirm
   * Confirm that an attachment upload has completed successfully.
   */
  app.post('/attachments/confirm', {
    preHandler: [authenticate],
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    void request.user;
    const body = confirmAttachmentSchema.parse(request.body);
    void body;
    // TODO: confirm attachment upload
    return reply.status(501).send({
      statusCode: 501,
      code: 'NOT_IMPLEMENTED',
      message: 'Attachment confirmation deferred to post-MVP',
    });
  });

  /**
   * GET /v1/attachments/:id/download
   * Get a short-lived pre-signed download URL for an attachment.
   */
  app.get<{ Params: { id: string } }>('/attachments/:id/download', {
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
    void request.user;
    const { id } = request.params;
    void id;
    // TODO: generate download URL
    return reply.status(501).send({
      statusCode: 501,
      code: 'NOT_IMPLEMENTED',
      message: 'Attachment download deferred to post-MVP',
    });
  });

  /**
   * DELETE /v1/attachments/:id
   * Delete an attachment (soft delete; storage cleanup is async).
   */
  app.delete<{ Params: { id: string } }>('/attachments/:id', {
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
    void request.user;
    const { id } = request.params;
    void id;
    // TODO: soft-delete attachment
    return reply.status(501).send({
      statusCode: 501,
      code: 'NOT_IMPLEMENTED',
      message: 'Attachment deletion deferred to post-MVP',
    });
  });
};

export default attachmentsRoutes;
