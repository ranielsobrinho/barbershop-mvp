import { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { TokenExpiredError, TokenInvalidError, UserNotFoundError, DomainError } from '../domain/errors/DomainError.js';
import jwt from 'jsonwebtoken';

export interface ValidateTokenInput {
  token: string;
}

export interface ValidateTokenOutput {
  valid: boolean;
  userId: string;
  email: string;
}

export class ValidateTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtSecret: string
  ) {}

  async execute(input: ValidateTokenInput): Promise<ValidateTokenOutput> {
    let payload: jwt.JwtPayload;
    
    try {
      payload = jwt.verify(input.token, this.jwtSecret) as jwt.JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError();
      }
      throw new TokenInvalidError();
    }

    const userId = payload.sub as string;
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return {
      valid: true,
      userId: user.id,
      email: user.email,
    };
  }
}
