import { IBlockRepository } from '../domain/repositories/IBlockRepository.js';
import { Block } from '../domain/entities/Block.js';
import { ValidationError } from '../domain/errors/DomainError.js';
import { IAppointmentRepository } from '../domain/repositories/IAppointmentRepository.js';

export interface CreateBlockInput {
  startsAt: string;
  endsAt: string;
  reason?: string;
}

export class CreateBlockUseCase {
  constructor(
    private readonly blockRepo: IBlockRepository,
    private readonly appointmentRepo: IAppointmentRepository
  ) {}

  /**
   * Ao bloquear um dia que já tem agendamentos, o sistema avisa
   * e lista os agendamentos afetados (return `affectedAppointments`).
   */
  async execute(input: CreateBlockInput, options?: { skipConflictCheck?: boolean }): Promise<{
    block: Block;
    affectedAppointments: Awaited<ReturnType<IBlockRepository['findByPeriod']>> | any[];
  }> {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
      throw new ValidationError('Datas inválidas');
    }
    if (endsAt <= startsAt) {
      throw new ValidationError('Data final deve ser posterior à data inicial');
    }

    const block = Block.create(startsAt, endsAt, input.reason);
    const created = await this.blockRepo.create(block);

    const affected = options?.skipConflictCheck
      ? []
      : await this.appointmentRepo.findByPeriod(startsAt, endsAt);

    return { block: created, affectedAppointments: affected };
  }
}
