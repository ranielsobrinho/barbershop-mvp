import { ISettingsRepository, SettingsSnapshot } from '../../domain/repositories/ISettingsRepository.js';
import prisma from '../database/prisma.js';

export class PrismaSettingsRepository implements ISettingsRepository {
  async get(): Promise<SettingsSnapshot> {
    const s = await prisma.settings.findFirst();
    if (!s) return { minNoticeHours: 2, maxDaysAhead: 60 };
    return { minNoticeHours: s.minNoticeHours, maxDaysAhead: s.maxDaysAhead };
  }
}
