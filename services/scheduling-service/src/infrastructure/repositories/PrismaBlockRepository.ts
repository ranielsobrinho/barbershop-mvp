import { IBlockRepository, BlockSnapshot } from '../../domain/repositories/IBlockRepository.js';
import prisma from '../database/prisma.js';

export class PrismaBlockRepository implements IBlockRepository {
  async findByPeriod(start: Date, end: Date, barberId?: string | null): Promise<BlockSnapshot[]> {
    const list = await prisma.block.findMany({
      where: {
        startsAt: { lt: end }, endsAt: { gt: start },
        ...(barberId === undefined ? {} : barberId === null ? { barberId: null } : { OR: [{ barberId }, { barberId: null }] }),
      },
    });
    return list.map(b => ({ id: b.id, startsAt: new Date(b.startsAt), endsAt: new Date(b.endsAt), reason: b.reason }));
  }

  async findConflicting(startsAt: Date, endsAt: Date, barberId?: string): Promise<BlockSnapshot[]> {
    const list = await prisma.block.findMany({
      where: { startsAt: { lt: endsAt }, endsAt: { gt: startsAt }, ...(barberId ? { OR: [{ barberId }, { barberId: null }] } : {}) },
    });
    return list.map(b => ({ id: b.id, startsAt: new Date(b.startsAt), endsAt: new Date(b.endsAt), reason: b.reason }));
  }
}
