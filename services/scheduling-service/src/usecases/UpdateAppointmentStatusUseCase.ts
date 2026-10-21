import { IAppointmentRepository } from '../domain/repositories/IAppointmentRepository.js';
import { ConflictChecker } from '../domain/services/ConflictChecker.js';
import { Appointment, AppointmentStatus } from '../domain/entities/Appointment.js';
import { NotFoundError, ConflictError } from '../domain/errors/DomainError.js';
import { isStatus, OCCUPYING_STATUSES } from '../domain/value-objects/AppointmentStatus.js';

export class UpdateAppointmentStatusUseCase {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly conflictChecker: ConflictChecker
  ) {}

  async execute(id: string, status: string): Promise<Appointment> {
    if (!isStatus(status)) throw new ConflictError('Status inválido');

    const existing = await this.appointmentRepo.findById(id);
    if (!existing) throw new NotFoundError('Agendamento', id);

    // Transição para status que ocupa: checar conflito (ex: cancelado → confirmado)
    if (OCCUPYING_STATUSES.includes(status as AppointmentStatus) && existing.status === 'CANCELADO') {
      await this.conflictChecker.assertNoConflict(existing.startsAt, existing.endsAt, existing.id);
    }

    const updated = new Appointment(
      existing.id, existing.serviceId, existing.customerName, existing.customerPhone,
      existing.startsAt, existing.endsAt, existing.priceCents,
      status as AppointmentStatus, existing.previousStartsAt,
      existing.createdAt, new Date()
    );

    return this.appointmentRepo.update(updated);
  }
}
