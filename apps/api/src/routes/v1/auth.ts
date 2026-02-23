import type { FastifyPluginAsync } from 'fastify';
import {
  googleAuthSchema,
  appleAuthSchema,
  refreshTokenSchema,
} from '@innera/shared';
import { authenticate } from '../../middleware/auth.js';

const authRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /v1/auth/google/code
   * Exchange a Google OAuth authorization code for session tokens.
   */
  app.post('/auth/google/code', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const body = googleAuthSchema.parse(request.body);
    void body;
    // TODO: implement Google OAuth exchange
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * POST /v1/auth/apple/code
   * Exchange an Apple Sign In authorization code for session tokens.
   */
  app.post('/auth/apple/code', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const body = appleAuthSchema.parse(request.body);
    void body;
    // TODO: implement Apple Sign In exchange
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * POST /v1/auth/refresh
   * Refresh a session using a refresh token.
   */
  app.post('/auth/refresh', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const body = refreshTokenSchema.parse(request.body);
    void body;
    // TODO: implement token refresh
    return reply.status(200).send({
      statusCode: 200,
      data: { message: 'TODO' },
    });
  });

  /**
   * GET /v1/auth/me
   * Return the currently authenticated user's profile.
   */
  app.get('/auth/me', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const user = request.user;
    // TODO: fetch full user profile
    return reply.status(200).send({
      statusCode: 200,
      data: { user },
    });
  });

  /**
   * POST /v1/auth/logout
   * Invalidate the current session.
   */
  app.post('/auth/logout', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    // TODO: invalidate session
    return reply.status(204).send();
  });

  /**
   * POST /v1/auth/logout-all
   * Invalidate all sessions for the current user.
   */
  app.post('/auth/logout-all', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    void request.user;
    // TODO: invalidate all sessions
    return reply.status(204).send();
  });
};

export default authRoutes;
