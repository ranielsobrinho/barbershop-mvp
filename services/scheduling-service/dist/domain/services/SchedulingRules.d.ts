export interface SchedulingSettings {
    minNoticeHours: number;
    maxDaysAhead: number;
}
export declare const TIMEZONE = "America/Fortaleza";
/**
 * Regras de agendamento puras (sem I/O).
 */
export declare class SchedulingRules {
    private readonly settings;
    constructor(settings: SchedulingSettings);
    /** Validar se uma data/hora pode ser agendada. */
    validateSlot(startsAt: Date, now?: Date): void;
    /** Nome do cliente: 2 a 80 caracteres. */
    validateCustomerName(name: string): void;
    /** Telefone BR com DDD: (11) 9XXXX-XXXX */
    validatePhone(phone: string): void;
    /** Datas: só futuras e dentro da janela. */
    validateBookingDate(date: Date, now?: Date): void;
}
