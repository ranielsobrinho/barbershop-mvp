import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaBusinessHoursRepository } from '../../../infrastructure/repositories/PrismaBusinessHoursRepository.js';

const hoursSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  opensAt: z.string().regex(/^\d{2}:\d{2}$/),
  closesAt: z.string().regex(/^\d{2}:\d{2}$/),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  breakEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  active: z.boolean(),
});

const updateSchema = z.object({ hours: z.array(hoursSchema).min(7).max(7) });

export class BusinessHoursController {
  constructor(private readonly repo: PrismaBusinessHoursRepository) {}

  async get(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = z.object({ barberId: z.string().min(1).default('barber_seu_carlos') }).parse(request.query);
    const hours = await this.repo.findAll(query.barberId);
    return reply.send({ hours });
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const body = z.object({ barberId: z.string().min(1).default('barber_seu_carlos'), hours: updateSchema.shape.hours }).parse(request.body);
      const { hours, barberId } = body;
      const updated = [];
      for (const h of hours) {
        updated.push(await this.repo.upsert({
          barberId, weekday: h.weekday, opensAt: h.opensAt, closesAt: h.closesAt,
          breakStart: h.breakStart ?? null, breakEnd: h.breakEnd ?? null, active: h.active,
        }));
      }
      return reply.send({ hours: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'VALIDATION_ERROR', details: error.flatten().fieldErrors });
      }
      throw error;
    }
  }
}
