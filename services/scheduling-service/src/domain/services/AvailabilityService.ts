import { SlotGenerator, RawSlot } from './SlotGenerator.js';
import { IBusinessHoursRepository } from '../repositories/IBusinessHoursRepository.js';
import { IBlockRepository } from '../repositories/IBlockRepository.js';
import { IAppointmentRepository } from '../repositories/IAppointmentRepository.js';
import { ISettingsRepository } from '../repositories/ISettingsRepository.js';
import { OCCUPYING_STATUSES } from '../value-objects/AppointmentStatus.js';
import { ConflictError, SlotUnavailableError } from '../errors/DomainError.js';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export interface AvailableSlot {
  start: string; // HH:mm (America/Fortaleza)
  end: string;   // HH:mm
}

interface CalendarDay { y: number; mo: number; d: number }

/**
 * Calcula a disponibilidade de horários.
 * Tudo é interpretado no fuso America/Fortaleza (UTC-3, sem DST).
 */
export class AvailabilityService {
  private readonly generator = new SlotGenerator();

  constructor(
    private readonly businessHoursRepo: IBusinessHoursRepository,
    private readonly blockRepo: IBlockRepository,
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly settingsRepo: ISettingsRepository,
    private readonly timezone: string = 'America/Fortaleza'
  ) {}

  /**
   * Slots livres de um dia (data = calendário YYYY-MM-DD) para um serviço.
   * Regras: dentro do expediente, fora do almoço, sem bloqueio,
   * sem sobreposição com agendamentos que ocupam horário.
   * Filtra slots que violam minNoticeHours (hoje) e maxDaysAhead (futuro).
   */
  async getAvailableSlots(date: Date, serviceSlotMin: number): Promise<AvailableSlot[]> {
    const settings = await this.settingsRepo.get();
    const now = new Date();
    
    // Check maxDaysAhead: if date is beyond the allowed window, return empty
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + settings.maxDaysAhead);
    maxDate.setHours(23, 59, 59, 999);
    if (date > maxDate) return [];

    const day = this.calendarDay(date);
    const weekday = new Date(Date.UTC(day.y, day.mo, day.d)).getUTCDay();
    const businessHours = await this.businessHoursRepo.findByWeekday(weekday);
    if (!businessHours || !businessHours.active) return [];

    const dayStart = this.wallToInstant(day, 0);
    const dayEnd = this.wallToInstant(day, 24 * 60 - 1);

    const blocks = await this.blockRepo.findByPeriod(dayStart, dayEnd);
    const appointments = await this.appointmentRepo.findByPeriod(dayStart, dayEnd);
    const occupying = appointments.filter(a => OCCUPYING_STATUSES.includes(a.status));

    const rawSlots = this.generator.generate(businessHours, serviceSlotMin);

    const free: AvailableSlot[] = [];
    for (const raw of rawSlots) {
      const start = this.wallToInstant(day, raw.startMinutes);
      const end = this.wallToInstant(day, raw.endMinutes);

      // Filter by minNoticeHours: for today, slots must start at least minNoticeHours from now
      const isToday = date.getUTCFullYear() === now.getUTCFullYear() &&
                      date.getUTCMonth() === now.getUTCMonth() &&
                      date.getUTCDate() === now.getUTCDate();
      if (isToday) {
        const minStartTime = new Date(now.getTime() + settings.minNoticeHours * 60 * 60 * 1000);
        if (start < minStartTime) continue;
      }

      if (blocks.some(b => this.overlaps(start, end, b.startsAt, b.endsAt))) continue;
      if (occupying.some(a => this.overlaps(start, end, a.startsAt, a.endsAt))) continue;

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
  async assertBookable(startsAt: Date, endsAt: Date, excludeId?: string): Promise<void> {
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
  async isSlotFree(startsAt: Date, endsAt: Date, excludeId?: string): Promise<boolean> {
    try {
      await this.assertBookable(startsAt, endsAt, excludeId);
      return true;
    } catch {
      return false;
    }
  }

  private calendarDay(date: Date): CalendarDay {
    return { y: date.getUTCFullYear(), mo: date.getUTCMonth(), d: date.getUTCDate() };
  }

  /** Instante UTC de `minutes` após a meia-noite do dia calendário no fuso da barbearia. */
  private wallToInstant(day: CalendarDay, minutes: number): Date {
    const fields = new Date(day.y, day.mo, day.d, 0, 0, 0, 0);
    fields.setMinutes(minutes);
    return fromZonedTime(fields, this.timezone);
  }

  private overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    return aStart < bEnd && aEnd > bStart;
  }

  private formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
