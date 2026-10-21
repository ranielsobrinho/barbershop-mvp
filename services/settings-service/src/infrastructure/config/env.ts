export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3006', 10),
  jwt: { secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-min-32-chars' },
  cookieSecret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
};
