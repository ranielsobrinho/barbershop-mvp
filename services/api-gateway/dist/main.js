import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import proxy from '@fastify/http-proxy';
import jwt from 'jsonwebtoken';
// Fail-fast in production for required secrets
if (process.env.NODE_ENV === 'production') {
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
        transport: process.env.NODE_ENV === 'development' ? {
            target: 'pino-pretty',
            options: { colorize: true }
        } : undefined,
    },
});
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-min-32-chars';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'cookie-secret-change-in-production';
// Service URLs
const services = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    scheduling: process.env.SCHEDULING_SERVICE_URL || 'http://localhost:3002',
    services: process.env.SERVICES_SERVICE_URL || 'http://localhost:3003',
    blocks: process.env.BLOCKS_SERVICE_URL || 'http://localhost:3004',
    businessHours: process.env.BUSINESS_HOURS_SERVICE_URL || 'http://localhost:3005',
    settings: process.env.SETTINGS_SERVICE_URL || 'http://localhost:3006',
};
// Register plugins
await app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
});
await app.register(helmet, {
    contentSecurityPolicy: false,
});
await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
});
await app.register(cookie, {
    secret: COOKIE_SECRET,
    hook: 'onRequest',
});
// Auth middleware for admin routes
async function adminAuthMiddleware(request, reply) {
    const token = request.cookies.auth_token || request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Token necessário' });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        request.user = { id: payload.sub, email: payload.email };
    }
    catch (error) {
        return reply.status(401).send({ error: 'InvalidToken', message: 'Token inválido' });
    }
}
// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
// Public routes - no auth required
await app.register(proxy, {
    prefix: '/api/auth',
    upstream: services.auth,
    http2: false,
    rewritePrefix: '/api/auth',
});
// Public API routes
await app.register(proxy, {
    prefix: '/api/services',
    upstream: services.services,
    http2: false,
    rewritePrefix: '/api/services',
});
await app.register(proxy, {
    prefix: '/api/availability',
    upstream: services.scheduling,
    http2: false,
    rewritePrefix: '/api/availability',
});
await app.register(proxy, {
    prefix: '/api/blocked-dates',
    upstream: services.scheduling,
    http2: false,
    rewritePrefix: '/api/blocked-dates',
});
await app.register(proxy, {
    prefix: '/api/appointments',
    upstream: services.scheduling,
    http2: false,
    rewritePrefix: '/api/appointments',
});
// Admin routes - require auth
await app.register(proxy, {
    prefix: '/api/admin/services',
    upstream: services.services,
    http2: false,
    rewritePrefix: '/api/admin/services',
    preHandler: adminAuthMiddleware,
});
await app.register(proxy, {
    prefix: '/api/admin/appointments',
    upstream: services.scheduling,
    http2: false,
    rewritePrefix: '/api/admin/appointments',
    preHandler: adminAuthMiddleware,
});
await app.register(proxy, {
    prefix: '/api/admin/blocks',
    upstream: services.blocks,
    http2: false,
    rewritePrefix: '/api/admin/blocks',
    preHandler: adminAuthMiddleware,
});
await app.register(proxy, {
    prefix: '/api/admin/business-hours',
    upstream: services.businessHours,
    http2: false,
    rewritePrefix: '/api/admin/business-hours',
    preHandler: adminAuthMiddleware,
});
await app.register(proxy, {
    prefix: '/api/admin/settings',
    upstream: services.settings,
    http2: false,
    rewritePrefix: '/api/admin/settings',
    preHandler: adminAuthMiddleware,
});
// Start server
const port = parseInt(process.env.PORT || '3000', 10);
try {
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`API Gateway listening on port ${port}`);
}
catch (error) {
    app.log.error(error);
    process.exit(1);
}
const shutdown = async (signal) => {
    app.log.info(`Received ${signal}, shutting down`);
    await app.close();
    process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
//# sourceMappingURL=main.js.map