import { z } from 'zod';
const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});
export class AuthController {
    loginUseCase;
    constructor(loginUseCase) {
        this.loginUseCase = loginUseCase;
    }
    async login(request, reply) {
        try {
            const body = loginSchema.parse(request.body);
            const result = await this.loginUseCase.execute(body);
            // Set httpOnly cookie
            reply.setCookie('auth_token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: '/',
            });
            return reply.send({
                token: result.token,
                user: result.user,
            });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'ValidationError',
                    message: 'Dados inválidos',
                    details: error.flatten().fieldErrors,
                });
            }
            throw error;
        }
    }
    async logout(_request, reply) {
        reply.clearCookie('auth_token', { path: '/' });
        return reply.send({ success: true });
    }
    async me(request, reply) {
        // User is attached by auth middleware
        const user = request.user;
        return reply.send({ user });
    }
}
//# sourceMappingURL=AuthController.js.map