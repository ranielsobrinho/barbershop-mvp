export const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3002', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    grpc: {
        port: parseInt(process.env.GRPC_PORT || '5002', 10),
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-min-32-chars',
    },
    databaseUrl: process.env.DATABASE_URL || 'postgresql://barbershop:barbershop@localhost:5432/barbershop',
};
//# sourceMappingURL=env.js.map