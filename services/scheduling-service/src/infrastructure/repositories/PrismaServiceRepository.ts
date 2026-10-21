import { IServiceRepository, ServiceSnapshot } from '../../domain/repositories/IServiceRepository.js';
import prisma from '../database/prisma.js';

export class PrismaServiceRepository implements IServiceRepository {
  async findById(id: string): Promise<ServiceSnapshot | null> {
    const s = await prisma.service.findUnique({ where: { id } });
    if (!s) return null;
    return { id: s.id, name: s.name, priceCents: s.priceCents, slotMin: s.slotMin, active: s.active };
  }
}
