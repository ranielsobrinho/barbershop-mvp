import jwt from 'jsonwebtoken';
export async function authMiddleware(request, reply) {
    const token = request.cookies.auth_token || request.headers.authorization?.replace('Bearer ', '');
    if (!token)
        return reply.status(401).send({ error: 'Unauthorized' });
    try {
        const jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-min-32-chars';
        const payload = jwt.verify(token, jwtSecret);
        request.user = { id: payload.sub };
    }
    catch {
        return reply.status(401).send({ error: 'InvalidToken' });
    }
}
//# sourceMappingURL=auth.js.map