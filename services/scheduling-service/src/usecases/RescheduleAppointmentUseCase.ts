import { IAppointmentRepository } from '../domain/repositories/IAppointmentRepository.js';
import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { ISettingsRepository } from '../domain/repositories/ISettingsRepository.js';
import { SchedulingRules } from '../domain/services/SchedulingRules.js';
import { AvailabilityService } from '../domain/services/AvailabilityService.js';
import { Appointment } from '../domain/entities/Appointment.js';
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors/DomainError.js';
import { addMinutes, parseISO } from 'date-fns';
import { AppointmentReminderScheduler } from './AppointmentReminderScheduler.js';

export class RescheduleAppointmentUseCase {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly serviceRepo: IServiceRepository,
    private readonly settingsRepo: ISettingsRepository,
    private readonly availability: AvailabilityService,
    private readonly reminderScheduler = new AppointmentReminderScheduler(),
  ) {}

  async execute(id: string, newStartsAtStr: string): Promise<Appointment> {
    const existing = await this.appointmentRepo.findById(id);
    if (!existing) throw new NotFoundError('Agendamento', id);

    const newStartsAt = parseISO(newStartsAtStr);
    if (isNaN(newStartsAt.getTime())) throw new ValidationError('Data/hora inválida');

    const service = await this.serviceRepo.findById(existing.serviceId);
    if (!service) throw new NotFoundError('Serviço', existing.serviceId);

    const newEndsAt = addMinutes(newStartsAt, service.slotMin);

    // Regras: antecedência mínima e janela máxima
    const settings = await this.settingsRepo.get();
    const rules = new SchedulingRules(settings);
    rules.validateSlot(newStartsAt);

    // Expediente, bloqueios e conflitos (excluindo o próprio agendamento)
    await this.availability.assertBookable(newStartsAt, newEndsAt, existing.id, service.slotMin);

    const oldStartsAt = existing.startsAt;

    // The repository lock protects the full schedule, including overlapping
    // appointments whose start times differ.
    return this.appointmentRepo.withSlotLock(oldStartsAt, async (tx) => {
      // Re-verify the appointment still exists and hasn't been modified
      const current = await tx.appointment.findUnique({ where: { id } });
      if (!current) throw new NotFoundError('Agendamento', id);
      if (new Date(current.startsAt).getTime() !== existing.startsAt.getTime()) {
        throw new ConflictError('Este agendamento foi alterado. Atualize a agenda e tente novamente.');
      }

      // Re-check availability for new slot (excluding current appointment)
      const conflicts = await tx.appointment.findMany({
        where: {
          startsAt: { lt: newEndsAt },
          endsAt: { gt: newStartsAt },
          status: { in: ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADO', 'REAGENDADO'] as any },
          id: { not: id },
        },
      });
      if (conflicts.length > 0) {
        throw new ValidationError('Horário não disponível');
      }

      // Re-check blocks for new slot
      const blocks = await tx.block.findMany({
        where: {
          startsAt: { lt: newEndsAt },
          endsAt: { gt: newStartsAt },
        },
      });
      if (blocks.length > 0) {
        throw new ValidationError('Horário bloqueado');
      }

      const rescheduled = existing.reschedule(newStartsAt, newEndsAt);

      const updated = await tx.appointment.update({
        where: { id: rescheduled.id },
        data: {
          customerName: rescheduled.customerName,
          customerPhone: rescheduled.customerPhone,
          startsAt: rescheduled.startsAt,
          endsAt: rescheduled.endsAt,
          priceCents: rescheduled.priceCents,
          status: rescheduled.status as any,
          previousStartsAt: rescheduled.previousStartsAt,
          updatedAt: rescheduled.updatedAt,
        },
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
