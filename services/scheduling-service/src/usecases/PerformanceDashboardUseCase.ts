import { fromZonedTime } from 'date-fns-tz';
import prisma from '../infrastructure/database/prisma.js';
import { ValidationError } from '../domain/errors/DomainError.js';

const TIMEZONE = 'America/Fortaleza';
const ACTIVE_STATUSES = ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADO', 'REAGENDADO'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ValidationError('Data deve estar no formato YYYY-MM-DD');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ValidationError('Data inválida');
  }
  return date;
}

function shiftDate(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function periodStats(from: string, to: string, now: Date) {
  const rangeStart = fromZonedTime(`${from}T00:00:00`, TIMEZONE);
  const rangeEnd = fromZonedTime(`${shiftDate(to, 1)}T00:00:00`, TIMEZONE);
  const where = { startsAt: { gte: rangeStart, lt: rangeEnd } };
  const [statusGroups, completedCount, weekdayGroups, hourGroups, serviceGroups] = await Promise.all([
    prisma.appointment.groupBy({
      by: ['status'], where,
      _count: { _all: true },
      _sum: { priceCents: true },
    }),
    prisma.appointment.count({
      where: {
        status: 'CONFIRMADO',
        startsAt: { gte: rangeStart, lt: now < rangeEnd ? now : rangeEnd },
      },
    }),
    prisma.$queryRaw<Array<{ bucket: number; count: number }>>`
      SELECT EXTRACT(DOW FROM ((a."startsAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TIMEZONE}))::int AS bucket,
             COUNT(*)::int AS count
      FROM "appointments" a
      WHERE a."startsAt" >= ${rangeStart} AND a."startsAt" < ${rangeEnd}
      GROUP BY bucket
    `,
    prisma.$queryRaw<Array<{ bucket: number; count: number }>>`
      SELECT EXTRACT(HOUR FROM ((a."startsAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TIMEZONE}))::int AS bucket,
             COUNT(*)::int AS count
      FROM "appointments" a
      WHERE a."startsAt" >= ${rangeStart} AND a."startsAt" < ${rangeEnd}
      GROUP BY bucket
    `,
    prisma.$queryRaw<Array<{ serviceName: string; count: number }>>`
      SELECT s."name" AS "serviceName", COUNT(*)::int AS count
      FROM "appointments" a
      INNER JOIN "services" s ON s."id" = a."serviceId"
      WHERE a."startsAt" >= ${rangeStart} AND a."startsAt" < ${rangeEnd}
      GROUP BY s."name"
      ORDER BY count DESC, s."name" ASC
    `,
  ]);

  const countsByStatus = new Map(statusGroups.map((group) => [group.status, group._count._all]));
  const bookedCount = ACTIVE_STATUSES.reduce((total, status) => total + (countsByStatus.get(status as typeof statusGroups[number]['status']) ?? 0), 0);
  const cancelledCount = countsByStatus.get('CANCELADO') ?? 0;
  const awaitingConfirmationCount = countsByStatus.get('AGUARDANDO_CONFIRMACAO') ?? 0;
  const bookedValueCents = statusGroups
    .filter((group) => group.status !== 'CANCELADO')
    .reduce((total, group) => total + (group._sum.priceCents ?? 0), 0);
  const weekdayCounts = new Map(weekdayGroups.map((group) => [group.bucket, group.count]));
  const hourCounts = new Map(hourGroups.map((group) => [group.bucket, group.count]));
  const weekdays = WEEKDAYS.map((label, index) => ({ label, count: weekdayCounts.get(index) ?? 0 }));
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, '0')}:00`, count: hourCounts.get(hour) ?? 0,
  }));

  return {
    metrics: {
      bookedCount,
      completedCount,
      cancelledCount,
      awaitingConfirmationCount,
      bookedValueCents,
    },
    weekdayBookings: weekdays,
    hourlyBookings: hours,
    serviceMix: serviceGroups,
  };
}

export class PerformanceDashboardUseCase {
  async execute(from: string, to: string) {
    parseDate(from);
    parseDate(to);
    if (from > to) throw new ValidationError('A data inicial deve ser anterior à data final');
    const duration = Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000) + 1;

    const comparisonTo = shiftDate(from, -1);
    const comparisonFrom = shiftDate(comparisonTo, -(duration - 1));
    const now = new Date();
    const [current, comparison] = await Promise.all([
      periodStats(from, to, now),
      periodStats(comparisonFrom, comparisonTo, now),
    ]);

    return {
      timezone: TIMEZONE,
      period: { from, to, ...current },
      comparison: { from: comparisonFrom, to: comparisonTo, ...comparison },
      definitions: {
        bookedCount: 'Agendamentos não cancelados com início no período; realizados estão incluídos.',
        completedCount: 'Agendamentos confirmados cujo horário de início já passou; é um subconjunto dos agendamentos.',
        cancelledCount: 'Agendamentos atualmente cancelados com início no período.',
        awaitingConfirmationCount: 'Agendamentos aguardando confirmação no momento da consulta.',
        bookedValueCents: 'Soma dos valores armazenados em agendamentos não cancelados; não representa receita recebida, pois não há estado de pagamento.',
        charts: 'Distribuições usam todos os registros de agendamento no período, inclusive os cancelados; reagendamentos contam na data/hora atual do registro.',
      },
    };
  }
}
