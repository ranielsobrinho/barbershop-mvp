import { z } from 'zod';
import { DomainError } from '../../../domain/errors/DomainError.js';
const createSchema = z.object({
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    reason: z.string().max(200).optional(),
    confirmed: z.boolean().optional(), // cliente confirmou cancelar agendamentos afetados
});
function handleError(reply, error) {
    if (error instanceof DomainError) {
        reply.status(error.statusCode).send({ error: error.code, message: error.message });
    }
    else if (error instanceof z.ZodError) {
        reply.status(400).send({ error: 'VALIDATION_ERROR', details: error.flatten().fieldErrors });
    }
    else {
        reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Erro interno' });
    }
}
export class BlocksController {
    list;
    create;
    remove;
    constructor(list, create, remove) {
        this.list = list;
        this.create = create;
        this.remove = remove;
    }
    async listAll(request, reply) {
        try {
            const query = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/).optional() }).parse(request.query);
            const blocks = await this.list.execute(query.month);
            return reply.send({ blocks });
        }
        catch (error) {
            return handleError(reply, error);
        }
    }
    async createBlock(request, reply) {
        try {
            const input = createSchema.parse(request.body);
            const result = await this.create.execute(input, { skipConflictCheck: input.confirmed === true });
            if (result.affectedAppointments.length > 0 && input.confirmed !== true) {
                return reply.status(409).send({
                    error: 'HAS_APPOINTMENTS',
                    message: 'O período informado possui agendamentos. Confirme para prosseguir.',
                    affectedAppointments: result.affectedAppointments,
                });
            }
            return reply.status(201).send({ block: result.block });
        }
        catch (error) {
            return handleError(reply, error);
        }
    }
    async deleteBlock(request, reply) {
        try {
            const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
            await this.remove.execute(id);
            return reply.send({ success: true });
        }
        catch (error) {
            return handleError(reply, error);
        }
    }
}
//# sourceMappingURL=BlocksController.js.map