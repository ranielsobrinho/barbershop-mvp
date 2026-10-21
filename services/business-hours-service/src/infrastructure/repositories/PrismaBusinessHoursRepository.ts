import prisma from '../database/prisma.js';

export interface BusinessHoursRow {
  id: string; weekday: number; opensAt: string; closesAt: string;
  breakStart: string | null; breakEnd: string | null; active: boolean;
}

export class PrismaBusinessHoursRepository {
  async findAll(): Promise<BusinessHoursRow[]> {
    return prisma.businessHours.findMany({ orderBy: { weekday: 'asc' } });
  }

  async upsert(data: { weekday: number; opensAt: string; closesAt: string; breakStart: string | null; breakEnd: string | null; active: boolean; }): Promise<BusinessHoursRow> {
    return prisma.businessHours.upsert({
      where: { weekday: data.weekday },
      update: data,
      create: data,
    });
  }
}
