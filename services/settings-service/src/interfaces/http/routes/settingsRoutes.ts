import { FastifyInstance } from 'fastify';
import { SettingsController } from '../controllers/SettingsController.js';
import { authMiddleware } from '../middleware/auth.js';

export async function publicRoutes(app: FastifyInstance, c: SettingsController): Promise<void> {
  app.get('/api/settings', c.get.bind(c));
}
export async function adminRoutes(app: FastifyInstance, c: SettingsController): Promise<void> {
  app.get('/api/admin/settings', { preHandler: authMiddleware }, c.get.bind(c));
  app.put('/api/admin/settings', { preHandler: authMiddleware }, c.update.bind(c));
}
