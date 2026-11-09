import { IAppointmentRepository } from '../domain/repositories/IAppointmentRepository.js';
import { Appointment, AppointmentStatus } from '../domain/entities/Appointment.js';
import { NotFoundError, ConflictError } from '../domain/errors/DomainError.js';
import { isStatus, OCCUPYING_STATUSES } from '../domain/value-objects/AppointmentStatus.js';
import { AppointmentReminderScheduler } from './AppointmentReminderScheduler.js';

export class UpdateAppointmentStatusUseCase {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly reminderScheduler = new AppointmentReminderScheduler(),
  ) {}

  async execute(id: string, status: string): Promise<Appointment> {
    if (!isStatus(status)) throw new ConflictError('Status inválido');

    const existing = await this.appointmentRepo.findById(id);
    if (!existing) throw new NotFoundError('Agendamento', id);

    return this.appointmentRepo.withSlotLock(existing.startsAt, async (tx) => {
      const current = await tx.appointment.findUnique({ where: { id } });
      if (!current) throw new NotFoundError('Agendamento', id);

      if (current.status === status) {
        return new Appointment(
          current.id, current.serviceId, current.customerName, current.customerPhone,
          new Date(current.startsAt), new Date(current.endsAt), current.priceCents,
          current.status, current.previousStartsAt ? new Date(current.previousStartsAt) : null,
          new Date(current.createdAt), new Date(current.updatedAt),
        );
      }

      // Re-check transitions into an occupying status under the same schedule
      // lock used by booking and rescheduling.
      if (OCCUPYING_STATUSES.includes(status as AppointmentStatus)) {
        const conflicts = await tx.appointment.findMany({
          where: {
            id: { not: id },
            startsAt: { lt: current.endsAt },
            endsAt: { gt: current.startsAt },
            status: { in: OCCUPYING_STATUSES as any },
          },
        });
        if (conflicts.length > 0) throw new ConflictError();
      }

      const updated = await tx.appointment.update({
        where: { id },
        data: { status: status as any, updatedAt: new Date() },
      });

      const result = new Appointment(
        updated.id, updated.serviceId, updated.customerName, updated.customerPhone,
        new Date(updated.startsAt), new Date(updated.endsAt), updated.priceCents,
        updated.status, updated.previousStartsAt ? new Date(updated.previousStartsAt) : null,
        new Date(updated.createdAt), new Date(updated.updatedAt)
      );
      await this.reminderScheduler.sync(tx, result);
      return result;
    });
  }
}
