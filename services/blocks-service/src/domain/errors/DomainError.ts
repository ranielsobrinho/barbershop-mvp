export class DomainError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode = 400) {
    super(message);
    this.name = 'DomainError';
  }
}
export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(`${resource} não encontrado${id ? `: ${id}` : ''}`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
export class ValidationError extends DomainError {
  constructor(message: string) { super(message, 'VALIDATION_ERROR', 400); this.name = 'ValidationError'; }
}
export class ConflictError extends DomainError {
  constructor(message = 'Operação em conflito') { super(message, 'CONFLICT', 409); this.name = 'ConflictError'; }
}
