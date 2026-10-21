export class DomainError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'DomainError';
    }
}
export class ConflictError extends DomainError {
    constructor(message = 'Horário indisponível: outro agendamento ocupa este horário') {
        super(message, 'CONFLICT', 409);
        this.name = 'ConflictError';
    }
}
export class SlotUnavailableError extends DomainError {
    constructor(message = 'Horário não está disponível') {
        super(message, 'SLOT_UNAVAILABLE', 409);
        this.name = 'SlotUnavailableError';
    }
}
export class NotFoundError extends DomainError {
    constructor(resource, id) {
        super(`${resource} não encontrado${id ? `: ${id}` : ''}`, 'NOT_FOUND', 404);
        this.name = 'NotFoundError';
    }
}
export class ValidationError extends DomainError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR', 400);
        this.name = 'ValidationError';
    }
}
export class MinNoticeError extends DomainError {
    constructor(hours) {
        super(`Agendamento deve ser feito com pelo menos ${hours} horas de antecedência`, 'MIN_NOTICE', 422);
        this.name = 'MinNoticeError';
    }
}
export class MaxDaysAheadError extends DomainError {
    constructor(days) {
        super(`Não é possível agendar com mais de ${days} dias de antecedência`, 'MAX_DAYS_AHEAD', 422);
        this.name = 'MaxDaysAheadError';
    }
}
//# sourceMappingURL=DomainError.js.map