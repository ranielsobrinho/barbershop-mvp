import { FastifyInstance } from 'fastify';
import { SchedulingController } from '../controllers/SchedulingController.js';
import { authMiddleware } from '../middleware/auth.js';

export async function publicRoutes(app: FastifyInstance, c: SchedulingController): Promise<void> {
  app.get('/api/availability', c.availability.bind(c));
  app.get('/api/blocked-dates', c.blockedDates.bind(c));
  app.post('/api/appointments', c.create.bind(c));
  app.post('/api/appointments/lookup', c.lookupByPhone.bind(c));
}

export async function adminRoutes(app: FastifyInstance, c: SchedulingController): Promise<void> {
  app.get('/api/admin/appointments', { preHandler: authMiddleware }, c.listByMonth.bind(c));
  app.patch('/api/admin/appointments/:id/status', { preHandler: authMiddleware }, c.updateStatus.bind(c));
  app.patch('/api/admin/appointments/:id/reschedule', { preHandler: authMiddleware }, c.rescheduleAppointment.bind(c));
}
