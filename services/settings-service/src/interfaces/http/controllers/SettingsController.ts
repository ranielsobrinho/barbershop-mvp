import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaSettingsRepository } from '../../../infrastructure/repositories/PrismaSettingsRepository.js';

const updateSchema = z.object({
  minNoticeHours: z.number().int().min(0).max(72).optional(),
  maxDaysAhead: z.number().int().min(1).max(365).optional(),
  heroText: z.string().max(500).nullable().optional(),
  heroImageUrl: z.string().url().max(500).nullable().optional(),
});

export class SettingsController {
  constructor(private readonly repo: PrismaSettingsRepository) {}

  async get(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const settings = await this.repo.get();
    return reply.send({ settings });
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const input = updateSchema.parse(request.body);
      const settings = await this.repo.update(input);
      return reply.send({ settings });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'VALIDATION_ERROR', details: error.flatten().fieldErrors });
      }
      throw error;
    }
  }
}
