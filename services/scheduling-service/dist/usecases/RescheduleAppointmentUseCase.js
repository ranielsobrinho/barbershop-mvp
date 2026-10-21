import { SchedulingRules } from '../domain/services/SchedulingRules.js';
import { Appointment } from '../domain/entities/Appointment.js';
import { NotFoundError, ValidationError } from '../domain/errors/DomainError.js';
import { addMinutes, parseISO } from 'date-fns';
export class RescheduleAppointmentUseCase {
    appointmentRepo;
    serviceRepo;
    settingsRepo;
    availability;
    constructor(appointmentRepo, serviceRepo, settingsRepo, availability) {
        this.appointmentRepo = appointmentRepo;
        this.serviceRepo = serviceRepo;
        this.settingsRepo = settingsRepo;
        this.availability = availability;
    }
    async execute(id, newStartsAtStr) {
        const existing = await this.appointmentRepo.findById(id);
        if (!existing)
            throw new NotFoundError('Agendamento', id);
        const newStartsAt = parseISO(newStartsAtStr);
        if (isNaN(newStartsAt.getTime()))
            throw new ValidationError('Data/hora inválida');
        const service = await this.serviceRepo.findById(existing.serviceId);
        if (!service)
            throw new NotFoundError('Serviço', existing.serviceId);
        const newEndsAt = addMinutes(newStartsAt, service.slotMin);
        // Regras: antecedência mínima e janela máxima
        const settings = await this.settingsRepo.get();
        const rules = new SchedulingRules(settings);
        rules.validateSlot(newStartsAt);
        // Expediente, bloqueios e conflitos (excluindo o próprio agendamento)
        await this.availability.assertBookable(newStartsAt, newEndsAt, existing.id);
        // Determine lock order to avoid deadlock: always lock earlier time first
        const oldStartsAt = existing.startsAt;
        const [firstLock, secondLock] = oldStartsAt < newStartsAt
            ? [oldStartsAt, newStartsAt]
            : [newStartsAt, oldStartsAt];
        // Execute reschedule atomically with both locks
        return this.appointmentRepo.withSlotLock(firstLock, async (tx) => {
            // If the locks are different times, acquire the second lock
            if (firstLock !== secondLock) {
                await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext($1))`, secondLock.toISOString());
            }
            // Re-verify the appointment still exists and hasn't been modified
            const current = await tx.appointment.findUnique({ where: { id } });
            if (!current)
                throw new NotFoundError('Agendamento', id);
            // Re-check availability for new slot (excluding current appointment)
            const conflicts = await tx.appointment.findMany({
                where: {
                    startsAt: { lt: newEndsAt },
                    endsAt: { gt: newStartsAt },
                    status: { in: ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADO', 'REAGENDADO'] },
                    id: { not: id },
                },
            });
            if (conflicts.length > 0) {
                throw new ValidationError('Horário não disponível');
            }
            // Re-check blocks for new slot
            const blocks = await tx.block.findMany({
                where: {
                    startsAt: { lt: newEndsAt },
                    endsAt: { gt: newStartsAt },
                },
            });
            if (blocks.length > 0) {
                throw new ValidationError('Horário bloqueado');
            }
            const rescheduled = existing.reschedule(newStartsAt, newEndsAt);
            const updated = await tx.appointment.update({
                where: { id: rescheduled.id },
                data: {
                    customerName: rescheduled.customerName,
                    customerPhone: rescheduled.customerPhone,
                    startsAt: rescheduled.startsAt,
                    endsAt: rescheduled.endsAt,
                    priceCents: rescheduled.priceCents,
                    status: rescheduled.status,
                    previousStartsAt: rescheduled.previousStartsAt,
                    updatedAt: rescheduled.updatedAt,
                },
            });
            return new Appointment(updated.id, updated.serviceId, updated.customerName, updated.customerPhone, new Date(updated.startsAt), new Date(updated.endsAt), updated.priceCents, updated.status, updated.previousStartsAt ? new Date(updated.previousStartsAt) : null, new Date(updated.createdAt), new Date(updated.updatedAt));
        });
    }
}
//# sourceMappingURL=RescheduleAppointmentUseCase.js.map