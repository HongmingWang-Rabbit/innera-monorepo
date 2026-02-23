import cors from '@fastify/cors';
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

function getAllowedOrigins(): string[] {
  const envOrigins = process.env['CORS_ORIGINS'];
  if (envOrigins) {
    return envOrigins.split(',').map((o) => o.trim()).filter(Boolean);
  }

  // Sensible defaults for development
  if (process.env['NODE_ENV'] !== 'production') {
    return [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
    ];
  }

  // Production fallback
  return [
    'https://innera.app',
    'https://www.innera.app',
  ];
}

export default fp(
  async function corsPlugin(app: FastifyInstance) {
    const allowedOrigins = getAllowedOrigins();

    await app.register(cors, {
      origin: (origin, cb) => {
        // Allow requests with no origin (server-to-server, mobile apps)
        if (!origin) {
          cb(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          cb(new Error('Origin not allowed by CORS'), false);
        }
      },
      credentials: true,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Request-Id',
        'X-Reauth-Token',
        'Idempotency-Key',
      ],
    });
  },
  { name: 'cors-plugin' },
);
