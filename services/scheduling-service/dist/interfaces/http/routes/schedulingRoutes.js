import { authMiddleware } from '../middleware/auth.js';
export async function publicRoutes(app, c) {
    app.get('/api/availability', c.availability.bind(c));
    app.get('/api/blocked-dates', c.blockedDates.bind(c));
    app.post('/api/appointments', c.create.bind(c));
}
export async function adminRoutes(app, c) {
    app.get('/api/admin/appointments', { preHandler: authMiddleware }, c.listByMonth.bind(c));
    app.patch('/api/admin/appointments/:id/status', { preHandler: authMiddleware }, c.updateStatus.bind(c));
    app.patch('/api/admin/appointments/:id/reschedule', { preHandler: authMiddleware }, c.rescheduleAppointment.bind(c));
}
//# sourceMappingURL=schedulingRoutes.js.map