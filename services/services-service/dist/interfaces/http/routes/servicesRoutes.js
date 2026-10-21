import { authMiddleware } from '../middleware/auth.js';
export async function servicesRoutes(app, controller) {
    // Public routes
    app.get('/', controller.list.bind(controller));
    app.get('/:id', controller.getById.bind(controller));
    // Admin routes (require auth)
    app.post('/', { preHandler: authMiddleware }, controller.create.bind(controller));
    app.put('/:id', { preHandler: authMiddleware }, controller.update.bind(controller));
    app.delete('/:id', { preHandler: authMiddleware }, controller.delete.bind(controller));
    app.patch('/:id/toggle', { preHandler: authMiddleware }, controller.toggleActive.bind(controller));
}
//# sourceMappingURL=servicesRoutes.js.map