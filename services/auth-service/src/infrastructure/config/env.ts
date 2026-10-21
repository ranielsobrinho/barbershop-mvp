export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  grpc: {
    port: parseInt(process.env.GRPC_PORT || '5001', 10),
    tls: process.env.GRPC_TLS_ENABLED === 'true' ? {
      keyPath: process.env.GRPC_TLS_KEY_PATH || '',
      certPath: process.env.GRPC_TLS_CERT_PATH || '',
    } : undefined,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-min-32-chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cookieSecret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://barbershop:barbershop@localhost:5432/barbershop',
};
