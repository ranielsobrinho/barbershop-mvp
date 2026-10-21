import { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { UserNotFoundError } from '../domain/errors/DomainError.js';

export interface GetUserByIdInput {
  userId: string;
}

export interface GetUserByIdOutput {
  id: string;
  email: string;
}

export class GetUserByIdUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: GetUserByIdInput): Promise<GetUserByIdOutput> {
    const user = await this.userRepository.findById(input.userId);
    
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    return {
      id: user.id,
      email: user.email,
    };
  }
}
