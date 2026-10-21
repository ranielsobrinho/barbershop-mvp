import prisma from '../database/prisma.js';
export class PrismaSettingsRepository {
    async get() {
        let s = await prisma.settings.findFirst();
        if (!s) {
            s = await prisma.settings.create({
                data: { id: 'default', minNoticeHours: 2, maxDaysAhead: 60, heroText: null, heroImageUrl: null },
            });
        }
        return s;
    }
    async update(data) {
        const current = await this.get();
        return prisma.settings.update({ where: { id: current.id }, data });
    }
}
//# sourceMappingURL=PrismaSettingsRepository.js.map