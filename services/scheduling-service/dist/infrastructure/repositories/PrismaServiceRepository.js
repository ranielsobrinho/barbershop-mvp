import prisma from '../database/prisma.js';
export class PrismaServiceRepository {
    async findById(id) {
        const s = await prisma.service.findUnique({ where: { id } });
        if (!s)
            return null;
        return { id: s.id, name: s.name, priceCents: s.priceCents, slotMin: s.slotMin, active: s.active };
    }
}
//# sourceMappingURL=PrismaServiceRepository.js.map