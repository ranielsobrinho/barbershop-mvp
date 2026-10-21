import { ServerCredentials } from '@grpc/grpc-js';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { env } from './infrastructure/config/env.js';
import { prisma } from './infrastructure/database/prisma.js';
import { buildGrpcServer } from './interfaces/grpc/server.js';
import { makeAuthHandler } from './interfaces/grpc/factories/makeAuthHandler.js';
import { authRoutes } from './interfaces/http/routes/authRoutes.js';
import { makeAuthController } from './interfaces/http/factories/makeAuthController.js';
import { readFileSync } from 'node:fs';
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
        transport: env.nodeEnv === 'development' ? {
            target: 'pino-pretty',
            options: { colorize: true }
        } : undefined,
    },
});
await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || env.cookieSecret,
    hook: 'onRequest',
});
// Global rate limit
await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
});
const authController = makeAuthController();
// Register auth routes with stricter rate limit for login
app.register(async (instance) => {
    // Stricter rate limit for login: 5 requests per minute per IP
    await instance.register(rateLimit, {
        max: 5,
        timeWindow: '1 minute',
        keyGenerator: (req) => req.ip,
    });
    await authRoutes(instance, authController);
}, { prefix: '/api/auth' });
const grpcCredentials = env.grpc.tls
    ? ServerCredentials.createSsl(null, [
        {
            private_key: readFileSync(env.grpc.tls.keyPath),
            cert_chain: readFileSync(env.grpc.tls.certPath),
        },
    ], false)
    : ServerCredentials.createInsecure();
try {
    await prisma.$queryRaw `SELECT 1`;
    app.log.info('Database connected');
}
catch (error) {
    app.log.error({ err: error }, 'Failed to connect to database');
    await prisma.$disconnect();
    process.exit(1);
}
const port = env.port;
try {
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`HTTP server listening on ${port}`);
}
catch (error) {
    app.log.error(error);
    process.exit(1);
}
const grpcServer = buildGrpcServer(makeAuthHandler());
grpcServer.bindAsync(`0.0.0.0:${env.grpc.port}`, grpcCredentials, (err, port) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`gRPC server listening on ${port}`);
});
const shutdown = async (signal) => {
    app.log.info(`Received ${signal}, shutting down`);
    await app.close();
    await new Promise((resolve) => grpcServer.tryShutdown(() => resolve()));
    await prisma.$disconnect();
    process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
//# sourceMappingURL=main.js.map