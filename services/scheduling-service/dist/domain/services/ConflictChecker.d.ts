import { IAppointmentRepository } from '../repositories/IAppointmentRepository.js';
/**
 * Checagem de conflito refeita no servidor no momento de gravar.
 * Em combinação com transação + índice no banco, impede dupla marcação.
 */
export declare class ConflictChecker {
    private readonly appointmentRepo;
    constructor(appointmentRepo: IAppointmentRepository);
    assertNoConflict(startsAt: Date, endsAt: Date, excludeId?: string): Promise<void>;
}
