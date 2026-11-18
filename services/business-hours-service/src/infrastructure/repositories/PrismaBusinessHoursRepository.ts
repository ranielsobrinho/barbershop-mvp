import prisma from '../database/prisma.js';
import { getTenantContext } from '@barbershop/tenant-context';

export interface BusinessHoursRow {
  id: string; weekday: number; opensAt: string; closesAt: string;
  breakStart: string | null; breakEnd: string | null; active: boolean;
}

export class PrismaBusinessHoursRepository {
  async findAll(barberId = 'barber_seu_carlos'): Promise<BusinessHoursRow[]> {
    return prisma.barberBusinessHours.findMany({ where: { barberId }, orderBy: { weekday: 'asc' } });
  }

  async upsert(data: { barberId?: string; weekday: number; opensAt: string; closesAt: string; breakStart: string | null; breakEnd: string | null; active: boolean; }): Promise<BusinessHoursRow> {
    const barberId = data.barberId || 'barber_seu_carlos';
    const { barberId: _barberId, ...hours } = data;
    return prisma.barberBusinessHours.upsert({
      where: { barberId_weekday: { barberId, weekday: data.weekday } },
      update: hours,
      create: { ...hours, barberId },
    });
  }
}
