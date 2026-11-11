import { randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const testDatabaseUrl = process.env.PHASE1_TEST_DATABASE_URL || process.env.DATABASE_URL;

describe.skipIf(!testDatabaseUrl)('customer admin API (PostgreSQL)', () => {
  let prisma: any;
  let app: ReturnType<typeof Fastify>;
  let serviceId: string;
  let customerId: string;
  let pastAppointmentId: string;
  let futureAppointmentId: string;
  let reminderId: string;
  let token: string;
  const bookingIds: string[] = [];
  const suffix = randomUUID();
  const phone = `859${String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')}`;
  const duplicatePhone = `859${String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')}`;

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;
    const [database, controllerModule, customerModule, routesModule] = await Promise.all([
      import('../../src/infrastructure/database/prisma.js'),
      import('../../src/interfaces/http/controllers/SchedulingController.js'),
      import('../../src/usecases/CustomerAdminUseCase.js'),
      import('../../src/interfaces/http/routes/schedulingRoutes.js'),
    ]);
    prisma = database.default;

    const service = await prisma.service.create({
      data: { name: `Customer history ${suffix}`, priceCents: 5000, slotMin: 30, active: true },
    });
    serviceId = service.id;
    const customer = await prisma.customer.create({
      data: { name: 'Rita Atual', phone },
    });
    customerId = customer.id;

    const now = new Date();
    const pastStart = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const futureStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const past = await prisma.appointment.create({
      data: {
        customerId, serviceId, customerName: 'Rita Antiga', customerPhone: phone,
        startsAt: pastStart, endsAt: new Date(pastStart.getTime() + 30 * 60 * 1000),
        priceCents: 4500, status: 'CONFIRMADO',
      },
    });
    pastAppointmentId = past.id;
    const future = await prisma.appointment.create({
      data: {
        customerId, serviceId, customerName: 'Rita Atual', customerPhone: phone,
        startsAt: futureStart, endsAt: new Date(futureStart.getTime() + 30 * 60 * 1000),
        priceCents: 5000, status: 'AGUARDANDO_CONFIRMACAO',
      },
    });
    futureAppointmentId = future.id;
    const reminder = await prisma.appointmentReminder.create({
      data: {
        appointmentId: future.id,
        scheduledAt: futureStart,
        nextAttemptAt: futureStart,
        idempotencyKey: `customer-test-${suffix}`,
      },
    });
    reminderId = reminder.id;

    const secret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-min-32-chars';
    token = jwt.sign({ sub: 'customer-test-admin', email: 'admin@example.test' }, secret);
    const controller = new controllerModule.SchedulingController(
      null as any, null as any, null as any, null as any,
      null as any, null as any, null as any, null as any,
      new customerModule.CustomerAdminUseCase(),
    );
    app = Fastify();
    await app.register(cookie, { secret: 'test-cookie-secret-at-least-32-characters', hook: 'onRequest' });
    await routesModule.adminRoutes(app, controller);
    await app.ready();
  }, 20000);

  afterAll(async () => {
    if (!prisma) return;
    if (app) await app.close();
    await prisma.appointmentReminder.deleteMany({ where: { id: reminderId || '' } });
    await prisma.appointment.deleteMany({ where: { id: { in: [pastAppointmentId, futureAppointmentId, ...bookingIds].filter(Boolean) } } });
    await prisma.customer.deleteMany({ where: { id: customerId || '' } });
    await prisma.customer.deleteMany({ where: { phone: duplicatePhone } });
    await prisma.service.deleteMany({ where: { id: serviceId || '' } });
    await prisma.$disconnect();
  });

  it('requires admin authentication for customer data', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/admin/customers' });
    expect(response.statusCode).toBe(401);
  });

  it('merges differently formatted bookings into one normalized customer while preserving appointment snapshots', async () => {
    const { CreateAppointmentUseCase } = await import('../../src/usecases/CreateAppointmentUseCase.js');
    const useCase = new CreateAppointmentUseCase(
      {
        countByPhone: async () => 0,
        withSlotLock: (_startsAt: Date, callback: (tx: any) => Promise<any>) => prisma.$transaction(callback),
      } as any,
      { findById: async () => ({ id: serviceId, active: true, slotMin: 30, priceCents: 5000 }) } as any,
      { get: async () => ({ minNoticeHours: 0, maxDaysAhead: 60 }) } as any,
      { assertBookable: async () => undefined } as any,
    );
    const first = await useCase.execute({
      serviceId,
      customerName: 'Rita Primeira',
      customerPhone: duplicatePhone,
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    bookingIds.push(first.id);
    const second = await useCase.execute({
      serviceId,
      customerName: 'Rita Atualizada',
      customerPhone: `+55 (${duplicatePhone.slice(0, 2)}) ${duplicatePhone.slice(2, 7)}-${duplicatePhone.slice(7)}`,
      startsAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    });
    bookingIds.push(second.id);

    const [firstRecord, secondRecord, matchingCustomers] = await Promise.all([
      prisma.appointment.findUnique({ where: { id: first.id } }),
      prisma.appointment.findUnique({ where: { id: second.id } }),
      prisma.customer.findMany({ where: { phone: duplicatePhone } }),
    ]);
    expect(matchingCustomers).toHaveLength(1);
    expect(firstRecord.customerId).toBe(matchingCustomers[0].id);
    expect(secondRecord.customerId).toBe(matchingCustomers[0].id);
    expect(firstRecord.customerName).toBe('Rita Primeira');
    expect(secondRecord.customerName).toBe('Rita Atualizada');
    expect(matchingCustomers[0].name).toBe('Rita Atualizada');
  });

  it('searches by phone and returns historical visits, next appointment, and rebooking service', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/admin/customers?q=${encodeURIComponent(phone.slice(3))}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode, response.body).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    const { customers } = response.json();
    expect(customers).toHaveLength(1);
    expect(customers[0]).toMatchObject({
      id: customerId,
      name: 'Rita Atual',
      phone,
      visitCount: 1,
      nextAppointment: { serviceName: `Customer history ${suffix}` },
    });
    expect(customers[0].lastVisit).toBeTruthy();
  });

  it('returns chronological history, service totals, export, and removes direct identity from retained appointments', async () => {
    const headers = { authorization: `Bearer ${token}` };
    const detailResponse = await app.inject({ method: 'GET', url: `/api/admin/customers/${customerId}`, headers });
    expect(detailResponse.statusCode, detailResponse.body).toBe(200);
    const { customer } = detailResponse.json();
    expect(customer.appointments.map((appointment: any) => appointment.id)).toEqual([futureAppointmentId, pastAppointmentId]);
    expect(customer.appointments[1].customerName).toBe('Rita Antiga');
    expect(customer.serviceTotals).toEqual([{ serviceName: `Customer history ${suffix}`, count: 1, totalCents: 4500 }]);
    expect(customer.rebookingServiceId).toBe(serviceId);

    const exportResponse = await app.inject({ method: 'GET', url: `/api/admin/customers/${customerId}/export`, headers });
    expect(exportResponse.statusCode).toBe(200);
    expect(exportResponse.headers['cache-control']).toBe('no-store');
    expect(exportResponse.headers['content-type']).toContain('text/csv');
    expect(exportResponse.headers['content-disposition']).toContain('.csv');
    expect(exportResponse.body).toContain('Nome do cliente');
    expect(exportResponse.body).toContain('Valor (R$)');
    expect(exportResponse.body).toContain(`Customer history ${suffix}`);
    expect(exportResponse.body).toContain('45,00');
    for (const internalColumn of ['customer_id', 'appointment_id', 'service_id', 'appointment_customer_name', 'appointment_customer_phone']) {
      expect(exportResponse.body).not.toContain(internalColumn);
    }

    const eraseResponse = await app.inject({ method: 'DELETE', url: `/api/admin/customers/${customerId}`, headers });
    expect(eraseResponse.statusCode).toBe(204);
    expect(await prisma.customer.findUnique({ where: { id: customerId } })).toBeNull();
    expect(await prisma.appointmentReminder.findUnique({ where: { id: reminderId } })).toBeNull();
    const retainedAppointment = await prisma.appointment.findUnique({ where: { id: pastAppointmentId } });
    expect(retainedAppointment).toMatchObject({ customerId: null, customerName: 'Cliente removido', customerPhone: '' });
  });
});
