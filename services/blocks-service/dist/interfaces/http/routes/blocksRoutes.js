import { authMiddleware } from '../middleware/auth.js';
export async function publicRoutes(app, c) {
    app.get('/api/blocked-dates', c.listAll.bind(c));
}
export async function adminRoutes(app, c) {
    app.get('/api/admin/blocks', { preHandler: authMiddleware }, c.listAll.bind(c));
    app.post('/api/admin/blocks', { preHandler: authMiddleware }, c.createBlock.bind(c));
    app.delete('/api/admin/blocks/:id', { preHandler: authMiddleware }, c.deleteBlock.bind(c));
}
//# sourceMappingURL=blocksRoutes.js.map