import { authMiddleware } from '../middleware/auth.js';
export async function publicRoutes(app, c) {
    app.get('/api/settings', c.get.bind(c));
}
export async function adminRoutes(app, c) {
    app.get('/api/admin/settings', { preHandler: authMiddleware }, c.get.bind(c));
    app.put('/api/admin/settings', { preHandler: authMiddleware }, c.update.bind(c));
}
//# sourceMappingURL=settingsRoutes.js.map