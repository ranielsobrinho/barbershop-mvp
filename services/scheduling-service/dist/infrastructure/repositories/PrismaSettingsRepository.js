import prisma from '../database/prisma.js';
export class PrismaSettingsRepository {
    async get() {
        const s = await prisma.settings.findFirst();
        if (!s)
            return { minNoticeHours: 2, maxDaysAhead: 60 };
        return { minNoticeHours: s.minNoticeHours, maxDaysAhead: s.maxDaysAhead };
    }
}
//# sourceMappingURL=PrismaSettingsRepository.js.map