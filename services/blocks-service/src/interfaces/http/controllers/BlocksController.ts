import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ListBlocksUseCase } from '../../../usecases/ListBlocksUseCase.js';
import { CreateBlockUseCase } from '../../../usecases/CreateBlockUseCase.js';
import { DeleteBlockUseCase } from '../../../usecases/DeleteBlockUseCase.js';
import { DomainError } from '../../../domain/errors/DomainError.js';

const createSchema = z.object({
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  reason: z.string().max(200).optional(),
  confirmed: z.boolean().optional(), // cliente confirmou cancelar agendamentos afetados
});

function handleError(reply: FastifyReply, error: unknown): void {
  if (error instanceof DomainError) {
    reply.status(error.statusCode).send({ error: error.code, message: error.message });
  } else if (error instanceof z.ZodError) {
    reply.status(400).send({ error: 'VALIDATION_ERROR', details: error.flatten().fieldErrors });
  } else {
    reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Erro interno' });
  }
}

export class BlocksController {
  constructor(
    private readonly list: ListBlocksUseCase,
    private readonly create: CreateBlockUseCase,
    private readonly remove: DeleteBlockUseCase
  ) {}

  async listAll(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/).optional() }).parse(request.query);
      const blocks = await this.list.execute(query.month);
      return reply.send({ blocks });
    } catch (error) { return handleError(reply, error); }
  }

  async createBlock(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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
    } catch (error) { return handleError(reply, error); }
  }

  async deleteBlock(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
      await this.remove.execute(id);
      return reply.send({ success: true });
    } catch (error) { return handleError(reply, error); }
  }
}
