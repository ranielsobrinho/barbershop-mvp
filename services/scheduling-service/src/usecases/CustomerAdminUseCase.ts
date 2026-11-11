import prisma from '../infrastructure/database/prisma.js';
import { NotFoundError } from '../domain/errors/DomainError.js';
import { Phone } from '../domain/value-objects/Phone.js';

function csvCell(value: unknown): string {
  let text = value instanceof Date ? value.toISOString() : value == null ? '' : String(value);
  if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

const exportColumns = [
  'Nome do cliente', 'Telefone', 'Cliente desde', 'Serviço',
  'Início do agendamento', 'Fim do agendamento', 'Status', 'Valor (R$)',
];

const businessDateTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Fortaleza',
  dateStyle: 'short',
  timeStyle: 'short',
});
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const activeStatuses = ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADO', 'REAGENDADO'];

export class CustomerAdminUseCase {
  async list(search?: string) {
    const term = search?.trim();
    const digits = term?.replace(/\D/g, '') ?? '';
    let phoneSearch = digits;
    if (term) {
      try { phoneSearch = Phone.create(term).value; } catch { /* Keep partial digit searches usable. */ }
    }
    const customers = await prisma.customer.findMany({
      where: term ? {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          ...(phoneSearch ? [{ phone: { contains: phoneSearch } }] : []),
        ],
      } : undefined,
      orderBy: [{ name: 'asc' }, { phone: 'asc' }],
      take: 100,
      select: { id: true, name: true, phone: true, createdAt: true },
    });
    if (!customers.length) return [];

    const ids = customers.map(({ id }) => id);
    const now = new Date();
    const [visitStats, lastVisits, nextAppointments] = await Promise.all([
      prisma.appointment.groupBy({
        by: ['customerId'],
        where: { customerId: { in: ids }, startsAt: { lt: now }, status: 'CONFIRMADO' },
        _count: { _all: true },
      }),
      prisma.appointment.findMany({
        where: { customerId: { in: ids }, startsAt: { lt: now }, status: 'CONFIRMADO' },
        orderBy: { startsAt: 'desc' },
        distinct: ['customerId'],
        select: { customerId: true, startsAt: true },
      }),
      prisma.appointment.findMany({
        where: { customerId: { in: ids }, startsAt: { gte: now }, status: { in: activeStatuses as any } },
        orderBy: { startsAt: 'asc' },
        distinct: ['customerId'],
        select: { customerId: true, startsAt: true, service: { select: { name: true } } },
      }),
    ]);

    const visits = new Map(visitStats.map((row) => [row.customerId, row._count._all]));
    const last = new Map(lastVisits.map((row) => [row.customerId, row.startsAt]));
    const next = new Map(nextAppointments.map((row) => [row.customerId, { startsAt: row.startsAt, serviceName: row.service.name }]));

    return customers.map((customer) => ({
      ...customer,
      visitCount: visits.get(customer.id) ?? 0,
      lastVisit: last.get(customer.id) ?? null,
      nextAppointment: next.get(customer.id) ?? null,
    }));
  }

  async detail(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
          include: { service: { select: { id: true, name: true, active: true } } },
        },
      },
    });
    if (!customer) throw new NotFoundError('Cliente', id);

    const now = new Date();
    const visits = customer.appointments.filter((appointment) =>
      appointment.status === 'CONFIRMADO' && appointment.startsAt < now,
    );
    const serviceTotals = new Map<string, { serviceName: string; count: number; totalCents: number }>();
    for (const appointment of visits) {
      const existing = serviceTotals.get(appointment.serviceId) ?? {
        serviceName: appointment.service.name,
        count: 0,
        totalCents: 0,
      };
      existing.count += 1;
      existing.totalCents += appointment.priceCents;
      serviceTotals.set(appointment.serviceId, existing);
    }

    const latestActiveService = customer.appointments.find((appointment) => appointment.service.active)?.service;
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      createdAt: customer.createdAt,
      visitCount: visits.length,
      lastVisit: visits[0]?.startsAt ?? null,
      nextAppointment: customer.appointments
        .filter((appointment) => appointment.startsAt >= now && activeStatuses.includes(appointment.status))
        .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())[0] ?? null,
      serviceTotals: [...serviceTotals.values()].sort((left, right) => right.totalCents - left.totalCents),
      rebookingServiceId: latestActiveService?.id ?? null,
      appointments: customer.appointments.map(({ service, ...appointment }) => ({
        ...appointment,
        service: { id: service.id, name: service.name },
      })),
    };
  }

  async exportCsv(id: string): Promise<AsyncIterable<string>> {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundError('Cliente', id);

    return (async function* () {
      yield `\uFEFF${exportColumns.map(csvCell).join(',')}\r\n`;
      let cursor: string | undefined;
      let firstPage = true;
      while (true) {
        const appointments = await prisma.appointment.findMany({
          where: { customerId: id },
          orderBy: { id: 'asc' },
          take: 500,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          include: { service: { select: { id: true, name: true } } },
        });
        if (!appointments.length) {
          if (firstPage) {
            yield [customer.name, customer.phone, businessDateTime.format(customer.createdAt)]
              .concat(Array(5).fill('')).map(csvCell).join(',') + '\r\n';
          }
          break;
        }
        firstPage = false;
        for (const appointment of appointments) {
          yield [customer.name, customer.phone, businessDateTime.format(customer.createdAt),
            appointment.service.name, businessDateTime.format(appointment.startsAt),
            businessDateTime.format(appointment.endsAt), appointment.status,
            brl.format(appointment.priceCents / 100)]
            .map(csvCell).join(',') + '\r\n';
        }
        cursor = appointments[appointments.length - 1].id;
        if (appointments.length < 500) break;
      }
    })();
  }

  async erase(id: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id }, select: { id: true } });
      if (!customer) throw new NotFoundError('Cliente', id);
      const appointments = await tx.appointment.findMany({ where: { customerId: id }, select: { id: true } });
      const appointmentIds = appointments.map(({ id: appointmentId }) => appointmentId);
      if (appointmentIds.length) {
        await tx.appointmentReminder.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
        await tx.appointment.updateMany({
          where: { customerId: id },
          data: { customerId: null, customerName: 'Cliente removido', customerPhone: '' },
        });
      }
      await tx.customer.delete({ where: { id } });
    });
  }
}
