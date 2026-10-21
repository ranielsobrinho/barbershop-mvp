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
export class NotFoundError extends DomainError {
    constructor(resource, id) {
        super(`${resource} não encontrado${id ? `: ${id}` : ''}`, 'NOT_FOUND', 404);
        this.name = 'NotFoundError';
    }
}
export class ValidationError extends DomainError {
    constructor(message) { super(message, 'VALIDATION_ERROR', 400); this.name = 'ValidationError'; }
}
export class ConflictError extends DomainError {
    constructor(message = 'Operação em conflito') { super(message, 'CONFLICT', 409); this.name = 'ConflictError'; }
}
//# sourceMappingURL=DomainError.js.map