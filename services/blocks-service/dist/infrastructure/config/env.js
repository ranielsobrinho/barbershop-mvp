export const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3004', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    jwt: { secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-min-32-chars' },
    cookieSecret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
};
//# sourceMappingURL=env.js.map