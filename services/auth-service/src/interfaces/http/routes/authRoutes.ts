import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/auth.js';

export async function authRoutes(
  app: FastifyInstance,
  authController: AuthController
): Promise<void> {
  // Public routes
  app.post('/login', authController.login.bind(authController));
  app.post('/logout', authController.logout.bind(authController));
  
  // Protected routes
  app.get('/me', { preHandler: authMiddleware }, authController.me.bind(authController));
}
