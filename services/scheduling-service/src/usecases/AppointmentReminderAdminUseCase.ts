import { randomUUID } from 'node:crypto';
import { IAppointmentRepository } from '../domain/repositories/IAppointmentRepository.js';
import { ConflictError, NotFoundError } from '../domain/errors/DomainError.js';
import { REMINDER_ELIGIBLE_STATUSES } from './AppointmentReminderScheduler.js';
import { PrismaAppointmentReminderRepository } from '../infrastructure/repositories/PrismaAppointmentReminderRepository.js';

export class AppointmentReminderAdminUseCase {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly reminderRepo = new PrismaAppointmentReminderRepository(),
  ) {}

  async getForAppointment(appointmentId: string) {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) throw new NotFoundError('Agendamento', appointmentId);
    return this.reminderRepo.findLatest(appointmentId);
  }

  async retry(appointmentId: string) {
    const existing = await this.appointmentRepo.findById(appointmentId);
    if (!existing) throw new NotFoundError('Agendamento', appointmentId);

    return this.appointmentRepo.withSlotLock(existing.startsAt, async (tx) => {
      const appointment = await tx.appointment.findUnique({ where: { id: appointmentId } });
      if (!appointment) throw new NotFoundError('Agendamento', appointmentId);
      if (!REMINDER_ELIGIBLE_STATUSES.includes(appointment.status)) {
        throw new ConflictError('O lembrete só pode ser reenviado para um agendamento confirmado.');
      }
      if (new Date(appointment.startsAt).getTime() <= Date.now()) {
        throw new ConflictError('Não é possível reenviar um lembrete de um horário que já passou.');
      }

      const config = await tx.whatsAppIntegration.findUnique({
        where: { id: 'default' },
        select: { provider: true, reminderEnabled: true },
      });
      if (!config?.reminderEnabled || !config.provider) {
        throw new ConflictError('Ative os lembretes e configure um provedor WhatsApp antes de tentar novamente.');
      }

      const latest = await tx.appointmentReminder.findFirst({
        where: { appointmentId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });
      if (!latest || latest.status !== 'FAILED') {
        throw new ConflictError('Só é possível tentar novamente após uma falha no envio.');
      }

      return tx.appointmentReminder.create({
        data: {
          appointmentId,
          scheduledAt: latest.scheduledAt,
          nextAttemptAt: new Date(),
          idempotencyKey: randomUUID(),
        },
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          nextAttemptAt: true,
          attemptCount: true,
          lastAttemptAt: true,
          sentAt: true,
          providerResponseCode: true,
          lastError: true,
        },
      });
    });
  }
}
