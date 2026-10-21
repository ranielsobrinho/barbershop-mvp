import { OCCUPYING_STATUSES } from '../value-objects/AppointmentStatus.js';
import { ConflictError } from '../errors/DomainError.js';
/**
 * Checagem de conflito refeita no servidor no momento de gravar.
 * Em combinação com transação + índice no banco, impede dupla marcação.
 */
export class ConflictChecker {
    appointmentRepo;
    constructor(appointmentRepo) {
        this.appointmentRepo = appointmentRepo;
    }
    async assertNoConflict(startsAt, endsAt, excludeId) {
        const conflicts = await this.appointmentRepo.findConflicting(startsAt, endsAt, excludeId);
        const blocking = conflicts.filter(a => OCCUPYING_STATUSES.includes(a.status));
        if (blocking.length > 0) {
            throw new ConflictError();
        }
    }
}
//# sourceMappingURL=ConflictChecker.js.map