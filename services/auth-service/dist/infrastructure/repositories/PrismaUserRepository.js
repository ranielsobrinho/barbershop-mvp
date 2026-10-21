import { User } from '../../domain/entities/User.js';
import prisma from '../database/prisma.js';
export class PrismaUserRepository {
    async findByEmail(email) {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user)
            return null;
        return new User(user.id, user.email, user.passwordHash, user.createdAt, user.updatedAt);
    }
    async findById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user)
            return null;
        return new User(user.id, user.email, user.passwordHash, user.createdAt, user.updatedAt);
    }
    async create(user) {
        const created = await prisma.user.create({
            data: {
                id: user.id,
                email: user.email,
                passwordHash: user.passwordHash,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
        return new User(created.id, created.email, created.passwordHash, created.createdAt, created.updatedAt);
    }
}
//# sourceMappingURL=PrismaUserRepository.js.map