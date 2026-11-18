import { IBusinessHoursRepository, BusinessHoursSnapshot } from '../../domain/repositories/IBusinessHoursRepository.js';
import prisma from '../database/prisma.js';

export class PrismaBusinessHoursRepository implements IBusinessHoursRepository {
  async findByWeekday(weekday: number, barberId = 'barber_seu_carlos'): Promise<BusinessHoursSnapshot | null> {
    const bh = await prisma.barberBusinessHours.findUnique({
      where: { barberId_weekday: { barberId, weekday } },
    });
    if (!bh) return null;
    return {
      weekday: bh.weekday, opensAt: bh.opensAt, closesAt: bh.closesAt,
      breakStart: bh.breakStart, breakEnd: bh.breakEnd, active: bh.active,
    };
  }

  async findAll(): Promise<BusinessHoursSnapshot[]> {
    const list = await prisma.businessHours.findMany({ orderBy: { weekday: 'asc' } });
    return list.map(bh => ({
      weekday: bh.weekday, opensAt: bh.opensAt, closesAt: bh.closesAt,
      breakStart: bh.breakStart, breakEnd: bh.breakEnd, active: bh.active,
    }));
  }
}
