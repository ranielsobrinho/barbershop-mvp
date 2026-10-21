import { Appointment } from '../domain/entities/Appointment.js';
import { NotFoundError, ConflictError } from '../domain/errors/DomainError.js';
import { isStatus, OCCUPYING_STATUSES } from '../domain/value-objects/AppointmentStatus.js';
export class UpdateAppointmentStatusUseCase {
    appointmentRepo;
    conflictChecker;
    constructor(appointmentRepo, conflictChecker) {
        this.appointmentRepo = appointmentRepo;
        this.conflictChecker = conflictChecker;
    }
    async execute(id, status) {
        if (!isStatus(status))
            throw new ConflictError('Status inválido');
        const existing = await this.appointmentRepo.findById(id);
        if (!existing)
            throw new NotFoundError('Agendamento', id);
        // Transição para status que ocupa: checar conflito (ex: cancelado → confirmado)
        if (OCCUPYING_STATUSES.includes(status) && existing.status === 'CANCELADO') {
            await this.conflictChecker.assertNoConflict(existing.startsAt, existing.endsAt, existing.id);
        }
        const updated = new Appointment(existing.id, existing.serviceId, existing.customerName, existing.customerPhone, existing.startsAt, existing.endsAt, existing.priceCents, status, existing.previousStartsAt, existing.createdAt, new Date());
        return this.appointmentRepo.update(updated);
    }
}
//# sourceMappingURL=UpdateAppointmentStatusUseCase.js.map