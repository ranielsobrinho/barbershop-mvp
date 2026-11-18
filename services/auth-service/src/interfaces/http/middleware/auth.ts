import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { getTenantContext } from '@barbershop/tenant-context';
import prisma from '../../../infrastructure/database/prisma.js';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = request.cookies.auth_token || request.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token de autenticação necessário',
    });
  }

  let payload: { sub: string; email: string };
  try {
    const jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
    payload = jwt.verify(token, jwtSecret) as typeof payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return reply.status(401).send({
        error: 'TokenExpired',
        message: 'Token expirado',
      });
    }
    return reply.status(401).send({
      error: 'InvalidToken',
      message: 'Token inválido',
    });
  }

  const tenant = getTenantContext();
  if (!tenant) return reply.status(403).send({ error: 'ShopContextRequired' });
  const membership = await prisma.tenantMembership.findUnique({
    where: { tenantId_userId: { tenantId: tenant.tenantId, userId: payload.sub } },
  });
  if (!membership) return reply.status(403).send({ error: 'ShopAccessDenied' });
  if (membership.role === 'STAFF') return reply.status(403).send({ error: 'InsufficientShopRole' });
  (request as any).user = { id: payload.sub, email: payload.email, tenantId: tenant.tenantId, role: membership.role };
}
