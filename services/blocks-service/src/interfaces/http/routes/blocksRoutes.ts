import { FastifyInstance } from 'fastify';
import { BlocksController } from '../controllers/BlocksController.js';
import { authMiddleware } from '../middleware/auth.js';

export async function publicRoutes(app: FastifyInstance, c: BlocksController): Promise<void> {
  app.get('/api/blocked-dates', c.listAll.bind(c));
}

export async function adminRoutes(app: FastifyInstance, c: BlocksController): Promise<void> {
  app.get('/api/admin/blocks', { preHandler: authMiddleware }, c.listAll.bind(c));
  app.post('/api/admin/blocks', { preHandler: authMiddleware }, c.createBlock.bind(c));
  app.delete('/api/admin/blocks/:id', { preHandler: authMiddleware }, c.deleteBlock.bind(c));
}
