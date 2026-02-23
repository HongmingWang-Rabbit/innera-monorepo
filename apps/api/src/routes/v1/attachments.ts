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
  }, async (request, reply) => {
    void request.user;
    const body = presignAttachmentSchema.parse(request.body);
    void body;
    // TODO: generate presigned URL
    return reply.status(201).send({
      statusCode: 201,
      data: { message: 'TODO' },
    });
  });

  /**
   * POST /v1/attachments/confirm
   * Confirm that an attachment upload has completed successfully.
   */
  app.post('/attachments/confirm', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    const body = confirmAttachmentSchema.parse(request.body);
    void body;
    // TODO: confirm attachment upload
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
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
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
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
    return reply.status(204).send();
  });
};

export default attachmentsRoutes;
