import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { getTenantContext } from '@barbershop/tenant-context';
import { env } from '../../../infrastructure/config/env.js';
import prisma from '../../../infrastructure/database/prisma.js';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = request.cookies.auth_token || request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Token necessário' });
  }
  try {
    const payload = jwt.verify(token, env.jwt.secret) as { sub: string; email: string };
    const tenant = getTenantContext();
    if (!tenant) return reply.status(403).send({ error: 'ShopContextRequired' });
    const membership = await prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId: tenant.tenantId, userId: payload.sub } },
    });
    if (!membership) return reply.status(403).send({ error: 'ShopAccessDenied' });
    if (membership.role === 'STAFF') return reply.status(403).send({ error: 'InsufficientShopRole' });
    (request as any).user = { id: payload.sub, email: payload.email, tenantId: tenant.tenantId, role: membership.role };
  } catch {
    return reply.status(401).send({ error: 'InvalidToken', message: 'Token inválido' });
  }
}
