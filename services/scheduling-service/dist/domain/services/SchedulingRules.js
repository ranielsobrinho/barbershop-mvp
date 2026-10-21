import { ValidationError, MinNoticeError, MaxDaysAheadError } from '../errors/DomainError.js';
export const TIMEZONE = 'America/Fortaleza';
/**
 * Regras de agendamento puras (sem I/O).
 */
export class SchedulingRules {
    settings;
    constructor(settings) {
        this.settings = settings;
    }
    /** Validar se uma data/hora pode ser agendada. */
    validateSlot(startsAt, now = new Date()) {
        // Antecedência mínima
        const minNoticeMs = this.settings.minNoticeHours * 60 * 60 * 1000;
        if (startsAt.getTime() - now.getTime() < minNoticeMs) {
            throw new MinNoticeError(this.settings.minNoticeHours);
        }
        // Janela máxima
        const maxAheadMs = this.settings.maxDaysAhead * 24 * 60 * 60 * 1000;
        if (startsAt.getTime() - now.getTime() > maxAheadMs) {
            throw new MaxDaysAheadError(this.settings.maxDaysAhead);
        }
    }
    /** Nome do cliente: 2 a 80 caracteres. */
    validateCustomerName(name) {
        const trimmed = name.trim();
        if (trimmed.length < 2 || trimmed.length > 80) {
            throw new ValidationError('Nome deve ter entre 2 e 80 caracteres');
        }
    }
    /** Telefone BR com DDD: (11) 9XXXX-XXXX */
    validatePhone(phone) {
        const digits = phone.replace(/\D/g, '');
        if (!/^(\d{10}|\d{11})$/.test(digits)) {
            throw new ValidationError('Telefone deve ter DDD e 8 ou 9 dígitos');
        }
    }
    /** Datas: só futuras e dentro da janela. */
    validateBookingDate(date, now = new Date()) {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        if (dateStart.getTime() < todayStart.getTime()) {
            throw new ValidationError('Não é possível agendar em data passada');
        }
    }
}
//# sourceMappingURL=SchedulingRules.js.map