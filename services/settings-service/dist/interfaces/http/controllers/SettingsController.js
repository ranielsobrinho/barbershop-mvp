import { z } from 'zod';
const updateSchema = z.object({
    minNoticeHours: z.number().int().min(0).max(72).optional(),
    maxDaysAhead: z.number().int().min(1).max(365).optional(),
    heroText: z.string().max(500).nullable().optional(),
    heroImageUrl: z.string().url().max(500).nullable().optional(),
});
export class SettingsController {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async get(_req, reply) {
        const settings = await this.repo.get();
        return reply.send({ settings });
    }
    async update(request, reply) {
        try {
            const input = updateSchema.parse(request.body);
            const settings = await this.repo.update(input);
            return reply.send({ settings });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: 'VALIDATION_ERROR', details: error.flatten().fieldErrors });
            }
            throw error;
        }
    }
}
//# sourceMappingURL=SettingsController.js.map