export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ServiceNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Serviço não encontrado: ${id}`, 'SERVICE_NOT_FOUND', 404);
    this.name = 'ServiceNotFoundError';
  }
}

export class ServiceHasAppointmentsError extends DomainError {
  constructor(id: string) {
    super(`Serviço possui agendamentos e não pode ser excluído`, 'SERVICE_HAS_APPOINTMENTS', 409);
    this.name = 'ServiceHasAppointmentsError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}
