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
export class ServiceNotFoundError extends DomainError {
    constructor(id) {
        super(`Serviço não encontrado: ${id}`, 'SERVICE_NOT_FOUND', 404);
        this.name = 'ServiceNotFoundError';
    }
}
export class ServiceHasAppointmentsError extends DomainError {
    constructor(id) {
        super(`Serviço possui agendamentos e não pode ser excluído`, 'SERVICE_HAS_APPOINTMENTS', 409);
        this.name = 'ServiceHasAppointmentsError';
    }
}
export class ValidationError extends DomainError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR', 400);
        this.name = 'ValidationError';
    }
}
//# sourceMappingURL=DomainError.js.map