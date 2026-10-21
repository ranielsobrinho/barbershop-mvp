import { ServerCredentials } from '@grpc/grpc-js';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { env } from './infrastructure/config/env.js';
import { prisma } from './infrastructure/database/prisma.js';
import { buildGrpcServer } from './interfaces/grpc/server.js';
import { makeServicesHandler } from './interfaces/grpc/factories/makeServicesHandler.js';
import { servicesRoutes } from './interfaces/http/routes/servicesRoutes.js';
import { makeServicesController } from './interfaces/http/factories/makeServicesController.js';
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
    secret: process.env.COOKIE_SECRET || env.jwt.secret,
    hook: 'onRequest',
});
const servicesController = makeServicesController();
app.register((instance) => servicesRoutes(instance, servicesController), { prefix: '/api/services' });
app.register((instance) => servicesRoutes(instance, servicesController), { prefix: '/api/admin/services' });
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
const grpcServer = buildGrpcServer(makeServicesHandler());
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