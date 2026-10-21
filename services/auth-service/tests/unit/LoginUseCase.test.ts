import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUseCase } from '../../src/usecases/LoginUseCase';
import { InvalidCredentialsError } from '../../src/domain/errors/DomainError';
import { User } from '../../src/domain/entities/User';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';

class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  addUser(user: User) {
    this.users.set(user.id, user);
  }
}

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockRepo: MockUserRepository;

  beforeEach(() => {
    mockRepo = new MockUserRepository();
    useCase = new LoginUseCase(mockRepo, 'test-secret', '7d');
  });

  it('should login successfully with valid credentials', async () => {
    const passwordHash = await vi.importActual('bcryptjs').then(bcrypt => bcrypt.hash('password123', 12));
    const user = User.create('test@example.com', passwordHash);
    mockRepo.addUser(user);

    const result = await useCase.execute({ email: 'test@example.com', password: 'password123' });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
  });

  it('should throw InvalidCredentialsError for non-existent user', async () => {
    await expect(useCase.execute({ email: 'nonexistent@example.com', password: 'password123' }))
      .rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw InvalidCredentialsError for wrong password', async () => {
    const passwordHash = await vi.importActual('bcryptjs').then(bcrypt => bcrypt.hash('password123', 12));
    const user = User.create('test@example.com', passwordHash);
    mockRepo.addUser(user);

    await expect(useCase.execute({ email: 'test@example.com', password: 'wrongpassword' }))
      .rejects.toThrow(InvalidCredentialsError);
  });
});
