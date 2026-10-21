import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { env } from './infrastructure/config/env.js';
import { prisma } from './infrastructure/database/prisma.js';
import { publicRoutes, adminRoutes } from './interfaces/http/routes/schedulingRoutes.js';
import { makeSchedulingController } from './interfaces/http/factories/makeSchedulingController.js';

// Fail-fast in production for required secrets
if (env.nodeEnv === 'production') {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is required in production');
    process.exit(1);
  }
  if (!process.env.COOKIE_SECRET) {
    console.error('FATAL: COOKIE_SECRET environment variable is required in production');
    process.exit(1);
  }
}

const app = Fastify({
  logger: {
    level: env.logLevel,
    transport: env.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

await app.register(cookie, { secret: process.env.COOKIE_SECRET || env.jwt.secret, hook: 'onRequest' });

const controller = makeSchedulingController();
await publicRoutes(app, controller);
await adminRoutes(app, controller);

app.get('/health', async () => ({ status: 'ok' }));

try {
  await prisma.$queryRaw`SELECT 1`;
  app.log.info('Database connected');
} catch (error) {
  app.log.error({ err: error }, 'Failed to connect to database');
  await prisma.$disconnect();
  process.exit(1);
}

try {
  await app.listen({ port: env.port, host: '0.0.0.0' });
  app.log.info(`Scheduling service listening on ${env.port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

const shutdown = async (signal: string): Promise<void> => {
  app.log.info(`Received ${signal}, shutting down`);
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
