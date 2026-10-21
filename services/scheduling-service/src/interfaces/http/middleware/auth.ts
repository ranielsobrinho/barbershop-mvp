import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = request.cookies.auth_token || request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Token necessário' });
  }
  try {
    const jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
    const payload = jwt.verify(token, jwtSecret) as { sub: string; email: string };
    (request as any).user = { id: payload.sub, email: payload.email };
  } catch {
    return reply.status(401).send({ error: 'InvalidToken', message: 'Token inválido' });
  }
}
