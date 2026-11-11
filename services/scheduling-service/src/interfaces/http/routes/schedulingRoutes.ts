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
  app.get('/api/admin/dashboard/performance', { preHandler: authMiddleware }, c.performanceDashboardData.bind(c));
  app.get('/api/admin/customers', { preHandler: authMiddleware }, c.listCustomers.bind(c));
  app.get('/api/admin/customers/:id/export', { preHandler: authMiddleware }, c.exportCustomer.bind(c));
  app.delete('/api/admin/customers/:id', { preHandler: authMiddleware }, c.eraseCustomer.bind(c));
  app.get('/api/admin/customers/:id', { preHandler: authMiddleware }, c.getCustomer.bind(c));
  app.get('/api/admin/appointments', { preHandler: authMiddleware }, c.listByMonth.bind(c));
  app.patch('/api/admin/appointments/:id/status', { preHandler: authMiddleware }, c.updateStatus.bind(c));
  app.patch('/api/admin/appointments/:id/reschedule', { preHandler: authMiddleware }, c.rescheduleAppointment.bind(c));
  app.get('/api/admin/appointments/:id/reminder', { preHandler: authMiddleware }, c.getAppointmentReminder.bind(c));
  app.post('/api/admin/appointments/:id/reminder/retry', { preHandler: authMiddleware }, c.retryAppointmentReminder.bind(c));
}
