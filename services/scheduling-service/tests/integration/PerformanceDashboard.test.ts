import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const testDatabaseUrl = process.env.PHASE1_TEST_DATABASE_URL || process.env.DATABASE_URL;

describe.skipIf(!testDatabaseUrl)('performance dashboard metrics (PostgreSQL)', () => {
  let prisma: any;
  let dashboard: any;
  const suffix = Math.random().toString(36).slice(2);
  let serviceAId = '';
  let serviceBId = '';
  const appointmentIds: string[] = [];

  const createAppointment = async (
    serviceId: string,
    startsAt: string,
    status: 'AGUARDANDO_CONFIRMACAO' | 'CONFIRMADO' | 'CANCELADO' | 'REAGENDADO',
    priceCents: number,
  ) => {
    const starts = new Date(startsAt);
    const appointment = await prisma.appointment.create({
      data: {
        serviceId,
        customerName: `Dashboard ${suffix}`,
        customerPhone: '85900000000',
        startsAt: starts,
        endsAt: new Date(starts.getTime() + 30 * 60_000),
        priceCents,
        status,
      },
    });
    appointmentIds.push(appointment.id);
    return appointment;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;
    const [database, useCaseModule] = await Promise.all([
      import('../../src/infrastructure/database/prisma.js'),
      import('../../src/usecases/PerformanceDashboardUseCase.js'),
    ]);
    prisma = database.default;
    dashboard = new useCaseModule.PerformanceDashboardUseCase();

    const serviceA = await prisma.service.create({
      data: { name: `Dashboard A ${suffix}`, priceCents: 5000, slotMin: 30, active: true },
    });
    const serviceB = await prisma.service.create({
      data: { name: `Dashboard B ${suffix}`, priceCents: 7000, slotMin: 30, active: true },
    });
    serviceAId = serviceA.id;
    serviceBId = serviceB.id;

    // Hand-calculated sample: six current-period appointments, one cancelled.
    await createAppointment(serviceAId, '2012-01-02T09:15:00-03:00', 'CONFIRMADO', 10_000);
    await createAppointment(serviceAId, '2012-01-02T10:30:00-03:00', 'CONFIRMADO', 5_000);
    await createAppointment(serviceBId, '2012-01-03T11:00:00-03:00', 'CANCELADO', 2_000);
    await createAppointment(serviceBId, '2012-01-04T12:00:00-03:00', 'AGUARDANDO_CONFIRMACAO', 7_000);
    await createAppointment(serviceAId, '2012-01-05T13:00:00-03:00', 'REAGENDADO', 3_000);
    await createAppointment(serviceBId, '2012-01-06T14:00:00-03:00', 'CONFIRMADO', 8_000);

    // Equivalent preceding week, also used to verify comparison metrics.
    await createAppointment(serviceAId, '2011-12-26T10:00:00-03:00', 'CONFIRMADO', 9_000);
    await createAppointment(serviceBId, '2011-12-30T15:00:00-03:00', 'CANCELADO', 1_000);

    // Local midnight boundaries for 2013-04-01 in America/Fortaleza.
    await createAppointment(serviceAId, '2013-03-31T23:59:59.999-03:00', 'CONFIRMADO', 3_000);
    await createAppointment(serviceAId, '2013-04-01T00:00:00-03:00', 'CONFIRMADO', 1_000);
    await createAppointment(serviceBId, '2013-04-01T23:59:59.999-03:00', 'CANCELADO', 2_000);
    await createAppointment(serviceBId, '2013-04-02T00:00:00-03:00', 'AGUARDANDO_CONFIRMACAO', 4_000);
  }, 20000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.appointment.deleteMany({ where: { id: { in: appointmentIds } } });
    await prisma.service.deleteMany({ where: { id: { in: [serviceAId, serviceBId].filter(Boolean) } } });
    await prisma.$disconnect();
  });

  it('matches the hand-calculated counts, values, chart buckets, and previous-period comparison', async () => {
    const report = await dashboard.execute('2012-01-02', '2012-01-08');

    expect(report.timezone).toBe('America/Fortaleza');
    expect(report.period.metrics).toEqual({
      bookedCount: 5,
      completedCount: 3,
      cancelledCount: 1,
      awaitingConfirmationCount: 1,
      bookedValueCents: 33_000,
    });
    expect(report.period.weekdayBookings.map(({ label, count }: any) => [label, count])).toEqual([
      ['Dom', 0], ['Seg', 2], ['Ter', 1], ['Qua', 1], ['Qui', 1], ['Sex', 1], ['Sáb', 0],
    ]);
    expect(report.period.hourlyBookings.filter(({ count }: any) => count > 0)).toEqual([
      { label: '09:00', count: 1 }, { label: '10:00', count: 1 }, { label: '11:00', count: 1 },
      { label: '12:00', count: 1 }, { label: '13:00', count: 1 }, { label: '14:00', count: 1 },
    ]);
    expect(report.period.serviceMix.map(({ serviceName, count }: any) => [serviceName, count])).toEqual([
      [`Dashboard A ${suffix}`, 3], [`Dashboard B ${suffix}`, 3],
    ]);
    expect(report.comparison).toMatchObject({
      from: '2011-12-26', to: '2012-01-01',
      metrics: { bookedCount: 1, completedCount: 1, cancelledCount: 1, awaitingConfirmationCount: 0, bookedValueCents: 9_000 },
    });
  });

  it('includes both Fortaleza date boundaries and excludes the adjacent instants', async () => {
    const report = await dashboard.execute('2013-04-01', '2013-04-01');

    expect(report.period.metrics).toEqual({
      bookedCount: 1,
      completedCount: 1,
      cancelledCount: 1,
      awaitingConfirmationCount: 0,
      bookedValueCents: 1_000,
    });
    expect(report.period.weekdayBookings[1]).toEqual({ label: 'Seg', count: 2 });
    expect(report.comparison).toMatchObject({
      from: '2013-03-31', to: '2013-03-31',
      metrics: { bookedCount: 1, completedCount: 1, cancelledCount: 0, awaitingConfirmationCount: 0, bookedValueCents: 3_000 },
    });
  });

  it('returns stable zero metrics and empty service mix for periods without appointments', async () => {
    const report = await dashboard.execute('1990-03-05', '1990-03-07');

    expect(report.period.metrics).toEqual({
      bookedCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      awaitingConfirmationCount: 0,
      bookedValueCents: 0,
    });
    expect(report.period.weekdayBookings).toHaveLength(7);
    expect(report.period.weekdayBookings.every(({ count }: any) => count === 0)).toBe(true);
    expect(report.period.hourlyBookings).toHaveLength(24);
    expect(report.period.hourlyBookings.every(({ count }: any) => count === 0)).toBe(true);
    expect(report.period.serviceMix).toEqual([]);
    expect(report.comparison.metrics.bookedCount).toBe(0);
  });
});
