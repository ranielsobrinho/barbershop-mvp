import { AuthController } from '../controllers/AuthController.js';
import { LoginUseCase } from '../../../usecases/LoginUseCase.js';
import { PrismaUserRepository } from '../../../infrastructure/repositories/PrismaUserRepository.js';

export function makeAuthController(): AuthController {
  const userRepository = new PrismaUserRepository();
  const jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  const loginUseCase = new LoginUseCase(userRepository, jwtSecret, jwtExpiresIn);
  
  return new AuthController(loginUseCase);
}
