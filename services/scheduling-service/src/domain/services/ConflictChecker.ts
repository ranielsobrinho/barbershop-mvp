import { IAppointmentRepository } from '../repositories/IAppointmentRepository.js';
import { OCCUPYING_STATUSES } from '../value-objects/AppointmentStatus.js';
import { ConflictError } from '../errors/DomainError.js';

/**
 * Checagem de conflito refeita no servidor no momento de gravar.
 * Em combinação com transação + índice no banco, impede dupla marcação.
 */
export class ConflictChecker {
  constructor(private readonly appointmentRepo: IAppointmentRepository) {}

  async assertNoConflict(startsAt: Date, endsAt: Date, excludeId?: string): Promise<void> {
    const conflicts = await this.appointmentRepo.findConflicting(startsAt, endsAt, excludeId);
    const blocking = conflicts.filter(a => OCCUPYING_STATUSES.includes(a.status));
    if (blocking.length > 0) {
      throw new ConflictError();
    }
  }
}
