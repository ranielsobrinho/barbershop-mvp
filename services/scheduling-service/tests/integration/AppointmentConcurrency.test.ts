import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AvailabilityService } from '../../src/domain/services/AvailabilityService.js';
import { ConflictError } from '../../src/domain/errors/DomainError.js';
import { CreateAppointmentUseCase } from '../../src/usecases/CreateAppointmentUseCase.js';

const testDatabaseUrl = process.env.PHASE1_TEST_DATABASE_URL;

describe.skipIf(!testDatabaseUrl)('appointment booking concurrency (PostgreSQL)', () => {
  let prisma: any;
  let useCase: CreateAppointmentUseCase;
  let businessHoursId: string | undefined;
  let previousBusinessHours: any | null = null;
  const serviceIds: string[] = [];
  const testPhones: string[] = [];

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;

    const [database, appointments, services, settings, businessHours, blocks] = await Promise.all([
      import('../../src/infrastructure/database/prisma.js'),
      import('../../src/infrastructure/repositories/PrismaAppointmentRepository.js'),
      import('../../src/infrastructure/repositories/PrismaServiceRepository.js'),
      import('../../src/infrastructure/repositories/PrismaSettingsRepository.js'),
      import('../../src/infrastructure/repositories/PrismaBusinessHoursRepository.js'),
      import('../../src/infrastructure/repositories/PrismaBlockRepository.js'),
    ]);

    prisma = database.default;
    const appointmentRepo = new appointments.PrismaAppointmentRepository();
    const settingsRepo = new settings.PrismaSettingsRepository();
    const availability = new AvailabilityService(
      new businessHours.PrismaBusinessHoursRepository(),
      new blocks.PrismaBlockRepository(),
      appointmentRepo,
      settingsRepo,
    );
    useCase = new CreateAppointmentUseCase(
      appointmentRepo,
      new services.PrismaServiceRepository(),
      settingsRepo,
      availability,
    );

    const suffix = randomUUID();
    for (const [name, slotMin] of [['Concurrency test 30m', 30], ['Concurrency test 15m', 15]] as const) {
      const service = await prisma.service.create({
        data: { name: `${name} ${suffix}`, priceCents: 1000, slotMin, active: true },
      });
      serviceIds.push(service.id);
    }

    previousBusinessHours = await prisma.businessHours.findUnique({ where: { weekday: 2 } });
    const hours = await prisma.businessHours.upsert({
      where: { weekday: 2 },
      create: { weekday: 2, opensAt: '09:00', closesAt: '18:00', breakStart: '12:00', breakEnd: '13:00', active: true },
      update: { opensAt: '09:00', closesAt: '18:00', breakStart: '12:00', breakEnd: '13:00', active: true },
    });
    businessHoursId = hours.id;
  }, 20000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.appointment.deleteMany({ where: { serviceId: { in: serviceIds } } });
    await prisma.customer.deleteMany({ where: { phone: { in: testPhones } } });
    await prisma.service.deleteMany({ where: { id: { in: serviceIds } } });
    if (previousBusinessHours) {
      await prisma.businessHours.update({
        where: { id: previousBusinessHours.id },
        data: {
          opensAt: previousBusinessHours.opensAt,
          closesAt: previousBusinessHours.closesAt,
          breakStart: previousBusinessHours.breakStart,
          breakEnd: previousBusinessHours.breakEnd,
          active: previousBusinessHours.active,
        },
      });
    } else if (businessHoursId) {
      await prisma.businessHours.delete({ where: { id: businessHoursId } });
    }
    await prisma.$disconnect();
  });

  it('allows only one of two simultaneous bookings with different but overlapping intervals', async () => {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    let daysUntilTuesday = (2 - day.getUTCDay() + 7) % 7;
    if (daysUntilTuesday < 4) daysUntilTuesday += 7;
    day.setUTCDate(day.getUTCDate() + daysUntilTuesday);

    const date = day.toISOString().slice(0, 10);
    const startsAt30Min = `${date}T12:30:00.000Z`; // 09:30–10:00 in Fortaleza
    const startsAt15Min = `${date}T12:45:00.000Z`; // 09:45–10:00 in Fortaleza
    const phoneSuffix = String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0');
    const phones = [`859${phoneSuffix}`, `859${String((Number(phoneSuffix) + 1) % 100_000_000).padStart(8, '0')}`];
    testPhones.push(...phones);

    const outcomes = await Promise.allSettled([
      useCase.execute({
        serviceId: serviceIds[0],
        customerName: 'Cliente de teste 30 minutos',
        customerPhone: phones[0],
        startsAt: startsAt30Min,
      }),
      useCase.execute({
        serviceId: serviceIds[1],
        customerName: 'Cliente de teste 15 minutos',
        customerPhone: phones[1],
        startsAt: startsAt15Min,
      }),
    ]);

    const successes = outcomes.filter((outcome) => outcome.status === 'fulfilled');
    const failures = outcomes.filter((outcome) => outcome.status === 'rejected');
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect((failures[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);
  });
});
