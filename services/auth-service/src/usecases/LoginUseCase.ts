import { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { InvalidCredentialsError, DomainError } from '../domain/errors/DomainError.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: string
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(input.email);
    
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn } as jwt.SignOptions
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
