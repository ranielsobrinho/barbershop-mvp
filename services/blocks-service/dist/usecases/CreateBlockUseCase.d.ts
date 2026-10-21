import { IBlockRepository } from '../domain/repositories/IBlockRepository.js';
import { Block } from '../domain/entities/Block.js';
import { IAppointmentRepository } from '../domain/repositories/IAppointmentRepository.js';
export interface CreateBlockInput {
    startsAt: string;
    endsAt: string;
    reason?: string;
}
export declare class CreateBlockUseCase {
    private readonly blockRepo;
    private readonly appointmentRepo;
    constructor(blockRepo: IBlockRepository, appointmentRepo: IAppointmentRepository);
    /**
     * Ao bloquear um dia que já tem agendamentos, o sistema avisa
     * e lista os agendamentos afetados (return `affectedAppointments`).
     */
    execute(input: CreateBlockInput, options?: {
        skipConflictCheck?: boolean;
    }): Promise<{
        block: Block;
        affectedAppointments: Awaited<ReturnType<IBlockRepository['findByPeriod']>> | any[];
    }>;
}
