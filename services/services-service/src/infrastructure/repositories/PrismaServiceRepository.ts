import { IServiceRepository } from '../../domain/repositories/IServiceRepository.js';
import { Service } from '../../domain/entities/Service.js';
import prisma from '../database/prisma.js';

export class PrismaServiceRepository implements IServiceRepository {
  async findAll(activeOnly = false): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { createdAt: 'asc' },
    });

    return services.map(s => new Service(
      s.id, s.name, s.description, s.priceCents, s.slotMin, s.active,
      s.createdAt, s.updatedAt
    ));
  }

  async findById(id: string): Promise<Service | null> {
    const s = await prisma.service.findUnique({ where: { id } });
    if (!s) return null;
    return new Service(s.id, s.name, s.description, s.priceCents, s.slotMin, s.active, s.createdAt, s.updatedAt);
  }

  async create(service: Service): Promise<Service> {
    const created = await prisma.service.create({
      data: {
        id: service.id,
        name: service.name,
        description: service.description,
        priceCents: service.priceCents,
        slotMin: service.slotMin,
        active: service.active,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      },
    });
    return new Service(created.id, created.name, created.description, created.priceCents, created.slotMin, created.active, created.createdAt, created.updatedAt);
  }

  async update(service: Service): Promise<Service> {
    const updated = await prisma.service.update({
      where: { id: service.id },
      data: {
        name: service.name,
        description: service.description,
        priceCents: service.priceCents,
        slotMin: service.slotMin,
        active: service.active,
        updatedAt: service.updatedAt,
      },
    });
    return new Service(updated.id, updated.name, updated.description, updated.priceCents, updated.slotMin, updated.active, updated.createdAt, updated.updatedAt);
  }

  async delete(id: string): Promise<void> {
    await prisma.service.delete({ where: { id } });
  }

  async hasAppointments(id: string): Promise<boolean> {
    const count = await prisma.appointment.count({ where: { serviceId: id } });
    return count > 0;
  }
}
