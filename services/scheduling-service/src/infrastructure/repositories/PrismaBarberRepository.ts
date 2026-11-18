import prisma from '../database/prisma.js';

export class PrismaBarberRepository {
  listActive() {
    return prisma.barber.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
