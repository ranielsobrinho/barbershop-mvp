import prisma from '../database/prisma.js';

export interface SettingsRow {
  id: string; minNoticeHours: number; maxDaysAhead: number;
  heroText: string | null; heroImageUrl: string | null;
}

export class PrismaSettingsRepository {
  async get(): Promise<SettingsRow> {
    let s = await prisma.settings.findFirst();
    if (!s) {
      s = await prisma.settings.create({
        data: { id: 'default', minNoticeHours: 2, maxDaysAhead: 60, heroText: null, heroImageUrl: null },
      });
    }
    return s;
  }

  async update(data: { minNoticeHours?: number; maxDaysAhead?: number; heroText?: string | null; heroImageUrl?: string | null; }): Promise<SettingsRow> {
    const current = await this.get();
    return prisma.settings.update({ where: { id: current.id }, data });
  }
}
