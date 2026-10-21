import { FastifyRequest, FastifyReply } from 'fastify';
import { LoginUseCase } from '../../../usecases/LoginUseCase.js';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = loginSchema.parse(request.body);
      const result = await this.loginUseCase.execute(body);
      
      // Set httpOnly cookie
      reply.setCookie('auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      return reply.send({
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: 'Dados inválidos',
          details: error.flatten().fieldErrors,
        });
      }
      throw error;
    }
  }

  async logout(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.clearCookie('auth_token', { path: '/' });
    return reply.send({ success: true });
  }

  async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // User is attached by auth middleware
    const user = (request as any).user;
    return reply.send({ user });
  }
}
