import { authMiddleware } from '../middleware/auth.js';
export async function authRoutes(app, authController) {
    // Public routes
    app.post('/login', authController.login.bind(authController));
    app.post('/logout', authController.logout.bind(authController));
    // Protected routes
    app.get('/me', { preHandler: authMiddleware }, authController.me.bind(authController));
}
//# sourceMappingURL=authRoutes.js.map