import prisma from '../database/prisma.js';
export class PrismaBusinessHoursRepository {
    async findAll() {
        return prisma.businessHours.findMany({ orderBy: { weekday: 'asc' } });
    }
    async upsert(data) {
        return prisma.businessHours.upsert({
            where: { weekday: data.weekday },
            update: data,
            create: data,
        });
    }
}
//# sourceMappingURL=PrismaBusinessHoursRepository.js.map