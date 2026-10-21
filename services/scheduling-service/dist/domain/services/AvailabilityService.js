import { SlotGenerator } from './SlotGenerator.js';
import { OCCUPYING_STATUSES } from '../value-objects/AppointmentStatus.js';
import { ConflictError, SlotUnavailableError } from '../errors/DomainError.js';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
/**
 * Calcula a disponibilidade de horários.
 * Tudo é interpretado no fuso America/Fortaleza (UTC-3, sem DST).
 */
export class AvailabilityService {
    businessHoursRepo;
    blockRepo;
    appointmentRepo;
    settingsRepo;
    timezone;
    generator = new SlotGenerator();
    constructor(businessHoursRepo, blockRepo, appointmentRepo, settingsRepo, timezone = 'America/Fortaleza') {
        this.businessHoursRepo = businessHoursRepo;
        this.blockRepo = blockRepo;
        this.appointmentRepo = appointmentRepo;
        this.settingsRepo = settingsRepo;
        this.timezone = timezone;
    }
    /**
     * Slots livres de um dia (data = calendário YYYY-MM-DD) para um serviço.
     * Regras: dentro do expediente, fora do almoço, sem bloqueio,
     * sem sobreposição com agendamentos que ocupam horário.
     * Filtra slots que violam minNoticeHours (hoje) e maxDaysAhead (futuro).
     */
    async getAvailableSlots(date, serviceSlotMin) {
        const settings = await this.settingsRepo.get();
        const now = new Date();
        // Check maxDaysAhead: if date is beyond the allowed window, return empty
        const maxDate = new Date(now);
        maxDate.setDate(maxDate.getDate() + settings.maxDaysAhead);
        maxDate.setHours(23, 59, 59, 999);
        if (date > maxDate)
            return [];
        const day = this.calendarDay(date);
        const weekday = new Date(Date.UTC(day.y, day.mo, day.d)).getUTCDay();
        const businessHours = await this.businessHoursRepo.findByWeekday(weekday);
        if (!businessHours || !businessHours.active)
            return [];
        const dayStart = this.wallToInstant(day, 0);
        const dayEnd = this.wallToInstant(day, 24 * 60 - 1);
        const blocks = await this.blockRepo.findByPeriod(dayStart, dayEnd);
        const appointments = await this.appointmentRepo.findByPeriod(dayStart, dayEnd);
        const occupying = appointments.filter(a => OCCUPYING_STATUSES.includes(a.status));
        const rawSlots = this.generator.generate(businessHours, serviceSlotMin);
        const free = [];
        for (const raw of rawSlots) {
            const start = this.wallToInstant(day, raw.startMinutes);
            const end = this.wallToInstant(day, raw.endMinutes);
            // Filter by minNoticeHours: for today, slots must start at least minNoticeHours from now
            const isToday = date.getUTCFullYear() === now.getUTCFullYear() &&
                date.getUTCMonth() === now.getUTCMonth() &&
                date.getUTCDate() === now.getUTCDate();
            if (isToday) {
                const minStartTime = new Date(now.getTime() + settings.minNoticeHours * 60 * 60 * 1000);
                if (start < minStartTime)
                    continue;
            }
            if (blocks.some(b => this.overlaps(start, end, b.startsAt, b.endsAt)))
                continue;
            if (occupying.some(a => this.overlaps(start, end, a.startsAt, a.endsAt)))
                continue;
            free.push({
                start: this.formatMinutes(raw.startMinutes),
                end: this.formatMinutes(raw.endMinutes),
            });
        }
        return free;
    }
    /**
     * Revalida no servidor que um horário pode ser gravado:
     * expediente ativo, dentro da abertura/fechamento, sem cruzar almoço,
     * sem tocar em bloqueio e sem sobrepor agendamento que ocupa.
     */
    async assertBookable(startsAt, endsAt, excludeId) {
        const wall = toZonedTime(startsAt, this.timezone);
        const endWall = toZonedTime(endsAt, this.timezone);
        const weekday = wall.getDay();
        const businessHours = await this.businessHoursRepo.findByWeekday(weekday);
        if (!businessHours || !businessHours.active) {
            throw new SlotUnavailableError('Dia não disponível para agendamento');
        }
        const startMin = wall.getHours() * 60 + wall.getMinutes();
        const endMin = endWall.getHours() * 60 + endWall.getMinutes();
        const openMin = this.generator.toMinutes(businessHours.opensAt);
        const closeMin = this.generator.toMinutes(businessHours.closesAt);
        if (startMin < openMin || endMin > closeMin) {
            throw new SlotUnavailableError('Horário fora do expediente');
        }
        if (businessHours.breakStart && businessHours.breakEnd) {
            const breakStart = this.generator.toMinutes(businessHours.breakStart);
            const breakEnd = this.generator.toMinutes(businessHours.breakEnd);
            if (startMin < breakEnd && endMin > breakStart) {
                throw new SlotUnavailableError('Horário cruza o intervalo de almoço');
            }
        }
        const blocks = await this.blockRepo.findConflicting(startsAt, endsAt);
        if (blocks.length > 0) {
            throw new SlotUnavailableError('Horário bloqueado');
        }
        const conflicts = await this.appointmentRepo.findConflicting(startsAt, endsAt, excludeId);
        if (conflicts.some(a => OCCUPYING_STATUSES.includes(a.status))) {
            throw new ConflictError();
        }
    }
    /** true se o horário pode ser gravado (expediente + bloqueios + conflitos). */
    async isSlotFree(startsAt, endsAt, excludeId) {
        try {
            await this.assertBookable(startsAt, endsAt, excludeId);
            return true;
        }
        catch {
            return false;
        }
    }
    calendarDay(date) {
        return { y: date.getUTCFullYear(), mo: date.getUTCMonth(), d: date.getUTCDate() };
    }
    /** Instante UTC de `minutes` após a meia-noite do dia calendário no fuso da barbearia. */
    wallToInstant(day, minutes) {
        const fields = new Date(day.y, day.mo, day.d, 0, 0, 0, 0);
        fields.setMinutes(minutes);
        return fromZonedTime(fields, this.timezone);
    }
    overlaps(aStart, aEnd, bStart, bEnd) {
        return aStart < bEnd && aEnd > bStart;
    }
    formatMinutes(minutes) {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    }
}
//# sourceMappingURL=AvailabilityService.js.map