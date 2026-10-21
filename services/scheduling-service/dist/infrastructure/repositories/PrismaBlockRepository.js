import prisma from '../database/prisma.js';
export class PrismaBlockRepository {
    async findByPeriod(start, end) {
        const list = await prisma.block.findMany({
            where: { startsAt: { lt: end }, endsAt: { gt: start } },
        });
        return list.map(b => ({ id: b.id, startsAt: new Date(b.startsAt), endsAt: new Date(b.endsAt), reason: b.reason }));
    }
    async findConflicting(startsAt, endsAt) {
        const list = await prisma.block.findMany({
            where: { startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
        });
        return list.map(b => ({ id: b.id, startsAt: new Date(b.startsAt), endsAt: new Date(b.endsAt), reason: b.reason }));
    }
}
//# sourceMappingURL=PrismaBlockRepository.js.map