import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import { env } from './infrastructure/config/env.js';
import { prisma } from './infrastructure/database/prisma.js';
import { publicRoutes, adminRoutes } from './interfaces/http/routes/settingsRoutes.js';
import { makeSettingsController } from './interfaces/http/factories/makeSettingsController.js';
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
        level: process.env.LOG_LEVEL || 'info',
        transport: env.nodeEnv === 'development'
            ? {
                target: '@mgcrea/pino-pretty-compact',
                options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
            }
            : undefined,
    },
});
await app.register(helmet);
await app.register(cookie, { secret: process.env.COOKIE_SECRET || env.jwt.secret, hook: 'onRequest' });
const controller = makeSettingsController();
await publicRoutes(app, controller);
await adminRoutes(app, controller);
app.get('/health', async () => ({ status: 'ok' }));
try {
    await prisma.$queryRaw `SELECT 1`;
}
catch {
    app.log.error('DB fail');
    process.exit(1);
}
try {
    await app.listen({ port: env.port, host: '0.0.0.0' });
    app.log.info(`Settings on ${env.port}`);
}
catch (e) {
    app.log.error(e);
    process.exit(1);
}
//# sourceMappingURL=main.js.map