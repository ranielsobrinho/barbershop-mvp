import { randomUUID } from 'node:crypto';
import type { FastifyBaseLogger } from 'fastify';
import prisma from '../database/prisma.js';
import { REMINDER_ELIGIBLE_STATUSES } from '../../usecases/AppointmentReminderScheduler.js';
import { ReminderDeliveryError, sendAppointmentReminder } from '../notifications/sendAppointmentReminder.js';

const BATCH_SIZE = 20;
const LEASE_DURATION_MS = 60_000;
const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 30_000;

export function reminderRetryDelayMs(attemptCount: number): number {
  return Math.min(60_000 * 2 ** Math.max(0, attemptCount - 1), 15 * 60_000);
}

interface ReminderLease {
  id: string;
  leaseToken: string;
}

export class AppointmentReminderWorker {
  private timer: NodeJS.Timeout | null = null;
  private inFlight: Promise<void> | null = null;

  constructor(private readonly logger: Pick<FastifyBaseLogger, 'warn' | 'error'>) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => { void this.runOnce(); }, POLL_INTERVAL_MS);
    this.timer.unref();
    void this.runOnce();
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    await this.inFlight;
  }

  private runOnce(): Promise<void> {
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.processDue().finally(() => { this.inFlight = null; });
    return this.inFlight;
  }

  private async processDue(): Promise<void> {
    let leases: ReminderLease[];
    try {
      leases = await this.claimDue();
    } catch (error) {
      this.logger.error({ err: error }, 'Could not claim due appointment reminders');
      return;
    }
    await Promise.all(leases.map((lease) => this.deliver(lease)));
  }

  private async claimDue(): Promise<ReminderLease[]> {
    return prisma.$transaction(async (tx) => {
      const due = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT r."id"
         FROM "appointment_reminders" r
         WHERE (
           (r."status" = 'PENDING'::"AppointmentReminderStatus" AND r."nextAttemptAt" <= CURRENT_TIMESTAMP)
           OR (r."status" = 'PROCESSING'::"AppointmentReminderStatus" AND r."leaseExpiresAt" <= CURRENT_TIMESTAMP)
         )
         AND EXISTS (
           SELECT 1 FROM "whatsapp_integration" w
           WHERE w."id" = 'default' AND w."reminderEnabled" = true AND w."provider" IS NOT NULL
         )
         ORDER BY r."nextAttemptAt" ASC
         LIMIT $1::integer
         FOR UPDATE SKIP LOCKED`,
        BATCH_SIZE,
      );

      const leases: ReminderLease[] = [];
      for (const row of due) {
        const leaseToken = randomUUID();
        await tx.appointmentReminder.update({
          where: { id: row.id },
          data: {
            status: 'PROCESSING',
            attemptCount: { increment: 1 },
            lastAttemptAt: new Date(),
            leaseExpiresAt: new Date(Date.now() + LEASE_DURATION_MS),
            leaseToken,
          },
        });
        leases.push({ id: row.id, leaseToken });
      }
      return leases;
    });
  }

  private async deliver(lease: ReminderLease): Promise<void> {
    try {
      const reminder = await prisma.appointmentReminder.findUnique({
        where: { id: lease.id },
        include: { appointment: { select: { id: true, status: true, startsAt: true } } },
      });
      if (!reminder || reminder.status !== 'PROCESSING' || reminder.leaseToken !== lease.leaseToken) return;

      if (
        !REMINDER_ELIGIBLE_STATUSES.some((status) => status === reminder.appointment.status) ||
        reminder.appointment.startsAt.getTime() <= Date.now()
      ) {
        await this.finishWithLease(lease, { status: 'CANCELLED', leaseExpiresAt: null, leaseToken: null });
        return;
      }

      const result = await sendAppointmentReminder(reminder.appointmentId, reminder.idempotencyKey);
      if (!result.sent) {
        await this.finishWithLease(lease, { status: 'CANCELLED', lastError: result.reason ?? null, leaseExpiresAt: null, leaseToken: null });
        return;
      }

      await this.finishWithLease(lease, {
        status: 'SENT',
        sentAt: new Date(),
        providerResponseCode: result.providerResponseCode ?? null,
        lastError: null,
        leaseExpiresAt: null,
        leaseToken: null,
      });
    } catch (error) {
      const reminder = await prisma.appointmentReminder.findUnique({ where: { id: lease.id }, select: { attemptCount: true } });
      if (!reminder) return;
      const responseCode = error instanceof ReminderDeliveryError ? error.responseCode : undefined;
      const message = error instanceof ReminderDeliveryError ? error.message : 'Falha inesperada ao enviar o lembrete.';
      if (reminder.attemptCount >= MAX_ATTEMPTS) {
        await this.finishWithLease(lease, {
          status: 'FAILED', lastError: message, providerResponseCode: responseCode ?? null,
          leaseExpiresAt: null, leaseToken: null,
        });
      } else {
        await this.finishWithLease(lease, {
          status: 'PENDING',
          nextAttemptAt: new Date(Date.now() + reminderRetryDelayMs(reminder.attemptCount)),
          lastError: message,
          providerResponseCode: responseCode ?? null,
          leaseExpiresAt: null,
          leaseToken: null,
        });
      }
      this.logger.warn({ reminderId: lease.id, attemptCount: reminder.attemptCount, responseCode }, 'Appointment reminder delivery failed');
    }
  }

  private async finishWithLease(lease: ReminderLease, data: Record<string, unknown>): Promise<void> {
    await prisma.appointmentReminder.updateMany({
      where: { id: lease.id, status: 'PROCESSING', leaseToken: lease.leaseToken },
      data: data as any,
    });
  }
}
