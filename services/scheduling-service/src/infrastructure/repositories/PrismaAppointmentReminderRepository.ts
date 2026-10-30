import prisma from '../database/prisma.js';

export class PrismaAppointmentReminderRepository {
  async findLatest(appointmentId: string) {
    return prisma.appointmentReminder.findFirst({
      where: { appointmentId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
  }
}
