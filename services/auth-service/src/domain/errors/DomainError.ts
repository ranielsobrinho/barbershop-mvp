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

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Credenciais inválidas', 'INVALID_CREDENTIALS', 401);
    this.name = 'InvalidCredentialsError';
  }
}

export class UserNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Usuário não encontrado: ${identifier}`, 'USER_NOT_FOUND', 404);
    this.name = 'UserNotFoundError';
  }
}

export class TokenExpiredError extends DomainError {
  constructor() {
    super('Token expirado', 'TOKEN_EXPIRED', 401);
    this.name = 'TokenExpiredError';
  }
}

export class TokenInvalidError extends DomainError {
  constructor() {
    super('Token inválido', 'TOKEN_INVALID', 401);
    this.name = 'TokenInvalidError';
  }
}
