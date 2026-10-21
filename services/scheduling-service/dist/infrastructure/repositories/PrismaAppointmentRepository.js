import { Appointment } from '../../domain/entities/Appointment.js';
import { OCCUPYING_STATUSES } from '../../domain/value-objects/AppointmentStatus.js';
import prisma from '../database/prisma.js';
function toDomain(a) {
    return new Appointment(a.id, a.serviceId, a.customerName, a.customerPhone, new Date(a.startsAt), new Date(a.endsAt), a.priceCents, a.status, a.previousStartsAt ? new Date(a.previousStartsAt) : null, new Date(a.createdAt), new Date(a.updatedAt));
}
function toIsoString(date) {
    // Return ISO string in UTC for consistent hashing
    return date.toISOString();
}
export class PrismaAppointmentRepository {
    async findById(id) {
        const a = await prisma.appointment.findUnique({ where: { id } });
        return a ? toDomain(a) : null;
    }
    async findByPeriod(start, end, includeCancelled = false) {
        const list = await prisma.appointment.findMany({
            where: {
                startsAt: { lt: end },
                endsAt: { gt: start },
                ...(includeCancelled ? {} : { status: { not: 'CANCELADO' } }),
            },
            orderBy: { startsAt: 'asc' },
        });
        return list.map(toDomain);
    }
    async findByMonth(year, month) {
        const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
        const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
        const list = await prisma.appointment.findMany({
            where: {
                startsAt: { gte: start, lt: end },
            },
            include: { service: true },
            orderBy: { startsAt: 'asc' },
        });
        return list.map(toDomain);
    }
    async findConflicting(startsAt, endsAt, excludeId) {
        const list = await prisma.appointment.findMany({
            where: {
                startsAt: { lt: endsAt },
                endsAt: { gt: startsAt },
                status: { in: OCCUPYING_STATUSES },
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
        });
        return list.map(toDomain);
    }
    async create(appointment) {
        const created = await prisma.appointment.create({
            data: {
                id: appointment.id,
                serviceId: appointment.serviceId,
                customerName: appointment.customerName,
                customerPhone: appointment.customerPhone,
                startsAt: appointment.startsAt,
                endsAt: appointment.endsAt,
                priceCents: appointment.priceCents,
                status: appointment.status,
                previousStartsAt: appointment.previousStartsAt,
                createdAt: appointment.createdAt,
                updatedAt: appointment.updatedAt,
            },
        });
        return toDomain(created);
    }
    async update(appointment) {
        const updated = await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
                customerName: appointment.customerName,
                customerPhone: appointment.customerPhone,
                startsAt: appointment.startsAt,
                endsAt: appointment.endsAt,
                priceCents: appointment.priceCents,
                status: appointment.status,
                previousStartsAt: appointment.previousStartsAt,
                updatedAt: appointment.updatedAt,
            },
        });
        return toDomain(updated);
    }
    async countByPhone(phone, since) {
        return prisma.appointment.count({
            where: {
                customerPhone: phone,
                createdAt: { gte: since },
            },
        });
    }
    async withSlotLock(startsAt, callback) {
        const isoString = toIsoString(startsAt);
        return prisma.$transaction(async (tx) => {
            // Acquire advisory lock for this time slot to serialize concurrent bookings
            await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext($1))`, isoString);
            return callback(tx);
        });
    }
}
//# sourceMappingURL=PrismaAppointmentRepository.js.map