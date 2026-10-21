import { IBusinessHoursRepository } from '../repositories/IBusinessHoursRepository.js';
import { IBlockRepository } from '../repositories/IBlockRepository.js';
import { IAppointmentRepository } from '../repositories/IAppointmentRepository.js';
import { ISettingsRepository } from '../repositories/ISettingsRepository.js';
export interface AvailableSlot {
    start: string;
    end: string;
}
/**
 * Calcula a disponibilidade de horários.
 * Tudo é interpretado no fuso America/Fortaleza (UTC-3, sem DST).
 */
export declare class AvailabilityService {
    private readonly businessHoursRepo;
    private readonly blockRepo;
    private readonly appointmentRepo;
    private readonly settingsRepo;
    private readonly timezone;
    private readonly generator;
    constructor(businessHoursRepo: IBusinessHoursRepository, blockRepo: IBlockRepository, appointmentRepo: IAppointmentRepository, settingsRepo: ISettingsRepository, timezone?: string);
    /**
     * Slots livres de um dia (data = calendário YYYY-MM-DD) para um serviço.
     * Regras: dentro do expediente, fora do almoço, sem bloqueio,
     * sem sobreposição com agendamentos que ocupam horário.
     * Filtra slots que violam minNoticeHours (hoje) e maxDaysAhead (futuro).
     */
    getAvailableSlots(date: Date, serviceSlotMin: number): Promise<AvailableSlot[]>;
    /**
     * Revalida no servidor que um horário pode ser gravado:
     * expediente ativo, dentro da abertura/fechamento, sem cruzar almoço,
     * sem tocar em bloqueio e sem sobrepor agendamento que ocupa.
     */
    assertBookable(startsAt: Date, endsAt: Date, excludeId?: string): Promise<void>;
    /** true se o horário pode ser gravado (expediente + bloqueios + conflitos). */
    isSlotFree(startsAt: Date, endsAt: Date, excludeId?: string): Promise<boolean>;
    private calendarDay;
    /** Instante UTC de `minutes` após a meia-noite do dia calendário no fuso da barbearia. */
    private wallToInstant;
    private overlaps;
    private formatMinutes;
}
