import { authMiddleware } from '../middleware/auth.js';
export async function publicRoutes(app, c) {
    app.get('/api/business-hours', c.get.bind(c));
}
export async function adminRoutes(app, c) {
    app.get('/api/admin/business-hours', { preHandler: authMiddleware }, c.get.bind(c));
    app.put('/api/admin/business-hours', { preHandler: authMiddleware }, c.update.bind(c));
}
//# sourceMappingURL=businessHoursRoutes.js.map