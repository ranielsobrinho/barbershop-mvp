import { ServiceNotFoundError, ServiceHasAppointmentsError, ValidationError } from '../../../domain/errors/DomainError.js';
import { z } from 'zod';
const createSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100),
    description: z.string().max(500).optional().nullable(),
    priceCents: z.number().int().min(0, 'Preço deve ser >= 0'),
    slotMin: z.number().int().min(1, 'Duração deve ser > 0'),
    active: z.boolean().optional(),
});
const updateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    priceCents: z.number().int().min(0).optional(),
    slotMin: z.number().int().min(1).optional(),
    active: z.boolean().optional(),
});
const paramsSchema = z.object({
    id: z.string().uuid('ID inválido'),
});
export class ServicesController {
    listActiveUseCase;
    getByIdUseCase;
    createUseCase;
    updateUseCase;
    deleteUseCase;
    toggleActiveUseCase;
    constructor(listActiveUseCase, getByIdUseCase, createUseCase, updateUseCase, deleteUseCase, toggleActiveUseCase) {
        this.listActiveUseCase = listActiveUseCase;
        this.getByIdUseCase = getByIdUseCase;
        this.createUseCase = createUseCase;
        this.updateUseCase = updateUseCase;
        this.deleteUseCase = deleteUseCase;
        this.toggleActiveUseCase = toggleActiveUseCase;
    }
    async list(request, reply) {
        const services = await this.listActiveUseCase.execute();
        return reply.send({ services });
    }
    async getById(request, reply) {
        try {
            const { id } = paramsSchema.parse(request.params);
            const service = await this.getByIdUseCase.execute(id);
            return reply.send({ service });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: 'ValidationError', details: error.flatten().fieldErrors });
            }
            throw error;
        }
    }
    async create(request, reply) {
        try {
            const input = createSchema.parse(request.body);
            const service = await this.createUseCase.execute(input);
            return reply.status(201).send({ service });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: 'ValidationError', details: error.flatten().fieldErrors });
            }
            if (error instanceof ValidationError) {
                return reply.status(400).send({ error: 'ValidationError', message: error.message });
            }
            throw error;
        }
    }
    async update(request, reply) {
        try {
            const { id } = paramsSchema.parse(request.params);
            const input = updateSchema.parse(request.body);
            const service = await this.updateUseCase.execute({ ...input, id });
            return reply.send({ service });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: 'ValidationError', details: error.flatten().fieldErrors });
            }
            if (error instanceof ServiceNotFoundError) {
                return reply.status(404).send({ error: 'NotFound', message: error.message });
            }
            if (error instanceof ValidationError) {
                return reply.status(400).send({ error: 'ValidationError', message: error.message });
            }
            throw error;
        }
    }
    async delete(request, reply) {
        try {
            const { id } = paramsSchema.parse(request.params);
            await this.deleteUseCase.execute(id);
            return reply.send({ success: true });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: 'ValidationError', details: error.flatten().fieldErrors });
            }
            if (error instanceof ServiceNotFoundError) {
                return reply.status(404).send({ error: 'NotFound', message: error.message });
            }
            if (error instanceof ServiceHasAppointmentsError) {
                return reply.status(409).send({ error: 'Conflict', message: error.message });
            }
            throw error;
        }
    }
    async toggleActive(request, reply) {
        try {
            const { id } = paramsSchema.parse(request.params);
            const { active } = z.object({ active: z.boolean() }).parse(request.body);
            await this.toggleActiveUseCase.execute(id, active);
            const service = await this.getByIdUseCase.execute(id);
            return reply.send({ service });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: 'ValidationError', details: error.flatten().fieldErrors });
            }
            if (error instanceof ServiceNotFoundError) {
                return reply.status(404).send({ error: 'NotFound', message: error.message });
            }
            throw error;
        }
    }
}
//# sourceMappingURL=ServicesController.js.map