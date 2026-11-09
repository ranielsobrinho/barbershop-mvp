import { describe, expect, it, vi } from 'vitest';
import { Appointment } from '../../src/domain/entities/Appointment.js';
import { calculateReminderTime, AppointmentReminderScheduler } from '../../src/usecases/AppointmentReminderScheduler.js';
import { reminderRetryDelayMs } from '../../src/infrastructure/reminders/AppointmentReminderWorker.js';

const at = new Date('2026-11-10T18:00:00.000Z');
const appointment = (status: 'CONFIRMADO' | 'CANCELADO' = 'CONFIRMADO') =>
  new Appointment('apt-1', 'service-1', 'Cliente', '85999991234', at, new Date(at.getTime() + 30 * 60_000), 5000, status, null, at, at);

describe('appointment reminders', () => {
  it('schedules at the configured lead time and clamps past due times to now', () => {
    const now = new Date('2026-11-09T18:00:00.000Z');
    expect(calculateReminderTime(at, 24, now)).toEqual(now);
    expect(calculateReminderTime(at, 12, now)).toEqual(new Date('2026-11-10T06:00:00.000Z'));
  });

  it('creates one pending reminder for an eligible future appointment when enabled', async () => {
    const tx = {
      appointmentReminder: { updateMany: vi.fn(), create: vi.fn() },
      whatsAppIntegration: { findUnique: vi.fn().mockResolvedValue({ reminderEnabled: true, reminderHoursBefore: 24 }) },
    };
    await new AppointmentReminderScheduler().sync(tx, appointment(), new Date('2026-11-09T18:00:00.000Z'));
    expect(tx.appointmentReminder.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { appointmentId: 'apt-1', status: { in: ['PENDING', 'PROCESSING'] } } }));
    expect(tx.appointmentReminder.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ appointmentId: 'apt-1', scheduledAt: new Date('2026-11-09T18:00:00.000Z'), nextAttemptAt: new Date('2026-11-09T18:00:00.000Z') }),
    }));
  });

  it('does not create reminders for cancelled or disabled appointments', async () => {
    const tx = {
      appointmentReminder: { updateMany: vi.fn(), create: vi.fn() },
      whatsAppIntegration: { findUnique: vi.fn().mockResolvedValue({ reminderEnabled: false, reminderHoursBefore: 24 }) },
    };
    const scheduler = new AppointmentReminderScheduler();
    await scheduler.sync(tx, appointment('CANCELADO'));
    await scheduler.sync(tx, appointment());
    expect(tx.appointmentReminder.create).not.toHaveBeenCalled();
    expect(tx.whatsAppIntegration.findUnique).toHaveBeenCalledTimes(1);
  });

  it('cancels a pending reminder and schedules a fresh reminder after rescheduling', async () => {
    const tx = {
      appointmentReminder: { updateMany: vi.fn(), create: vi.fn() },
      whatsAppIntegration: { findUnique: vi.fn().mockResolvedValue({ reminderEnabled: true, reminderHoursBefore: 24 }) },
    };
    const rescheduled = new Appointment(
      'apt-1', 'service-1', 'Cliente', '85999991234',
      new Date('2026-11-11T18:00:00.000Z'), new Date('2026-11-11T18:30:00.000Z'), 5000,
      'REAGENDADO', at, at, at,
    );

    await new AppointmentReminderScheduler().sync(tx, rescheduled, new Date('2026-11-09T18:00:00.000Z'));

    expect(tx.appointmentReminder.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { appointmentId: 'apt-1', status: { in: ['PENDING', 'PROCESSING'] } },
      data: expect.objectContaining({ status: 'CANCELLED' }),
    }));
    expect(tx.appointmentReminder.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        appointmentId: 'apt-1',
        scheduledAt: new Date('2026-11-10T18:00:00.000Z'),
        nextAttemptAt: new Date('2026-11-10T18:00:00.000Z'),
      }),
    }));
  });

  it('uses bounded exponential retry delays', () => {
    expect([1, 2, 3, 4, 5, 6].map(reminderRetryDelayMs)).toEqual([60_000, 120_000, 240_000, 480_000, 900_000, 900_000]);
  });
});
