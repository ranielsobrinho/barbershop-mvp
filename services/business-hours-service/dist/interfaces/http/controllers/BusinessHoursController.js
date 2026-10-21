import { z } from 'zod';
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
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async get(_req, reply) {
        const hours = await this.repo.findAll();
        return reply.send({ hours });
    }
    async update(request, reply) {
        try {
            const { hours } = updateSchema.parse(request.body);
            const updated = [];
            for (const h of hours) {
                updated.push(await this.repo.upsert({
                    weekday: h.weekday, opensAt: h.opensAt, closesAt: h.closesAt,
                    breakStart: h.breakStart ?? null, breakEnd: h.breakEnd ?? null, active: h.active,
                }));
            }
            return reply.send({ hours: updated });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: 'VALIDATION_ERROR', details: error.flatten().fieldErrors });
            }
            throw error;
        }
    }
}
//# sourceMappingURL=BusinessHoursController.js.map