import { AuthHandler } from '../handlers/AuthHandler.js';
import { ValidateTokenUseCase } from '../../../usecases/ValidateTokenUseCase.js';
import { GetUserByIdUseCase } from '../../../usecases/GetUserByIdUseCase.js';
import { PrismaUserRepository } from '../../../infrastructure/repositories/PrismaUserRepository.js';
export function makeAuthHandler() {
    const userRepository = new PrismaUserRepository();
    const jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
    const validateTokenUseCase = new ValidateTokenUseCase(userRepository, jwtSecret);
    const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
    return new AuthHandler(validateTokenUseCase, getUserByIdUseCase);
}
//# sourceMappingURL=makeAuthHandler.js.map