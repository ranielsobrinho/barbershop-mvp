import { randomUUID } from 'node:crypto';
import type { Appointment } from '../domain/entities/Appointment.js';

export const REMINDER_ELIGIBLE_STATUSES = ['CONFIRMADO', 'REAGENDADO'] as const;

export function calculateReminderTime(startsAt: Date, hoursBefore: number, now = new Date()): Date {
  const configuredTime = startsAt.getTime() - hoursBefore * 60 * 60 * 1000;
  return new Date(Math.max(configuredTime, now.getTime()));
}

export class AppointmentReminderScheduler {
  async sync(tx: any, appointment: Appointment, now = new Date()): Promise<void> {
    await tx.appointmentReminder.updateMany({
      where: { appointmentId: appointment.id, status: { in: ['PENDING', 'PROCESSING'] } },
      data: { status: 'CANCELLED', leaseExpiresAt: null, leaseToken: null },
    });

    if (
      !REMINDER_ELIGIBLE_STATUSES.includes(appointment.status as typeof REMINDER_ELIGIBLE_STATUSES[number]) ||
      appointment.startsAt.getTime() <= now.getTime()
    ) return;

    const config = await tx.whatsAppIntegration.findUnique({
      where: { id: 'default' },
      select: { reminderEnabled: true, reminderHoursBefore: true },
    });
    if (!config?.reminderEnabled) return;

    const scheduledAt = calculateReminderTime(appointment.startsAt, config.reminderHoursBefore, now);
    await tx.appointmentReminder.create({
      data: {
        appointmentId: appointment.id,
        scheduledAt,
        nextAttemptAt: scheduledAt,
        idempotencyKey: randomUUID(),
      },
    });
  }
}
