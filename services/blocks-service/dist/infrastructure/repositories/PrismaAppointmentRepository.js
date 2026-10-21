import prisma from '../database/prisma.js';
export class PrismaAppointmentRepository {
    async findByPeriod(start, end) {
        const list = await prisma.appointment.findMany({
            where: { startsAt: { lt: end }, endsAt: { gt: start }, status: { not: 'CANCELADO' } },
            orderBy: { startsAt: 'asc' },
        });
        return list.map(a => ({
            id: a.id, customerName: a.customerName,
            startsAt: new Date(a.startsAt), endsAt: new Date(a.endsAt),
            status: a.status,
        }));
    }
}
//# sourceMappingURL=PrismaAppointmentRepository.js.map