import { UserNotFoundError } from '../domain/errors/DomainError.js';
export class GetUserByIdUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(input) {
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
//# sourceMappingURL=GetUserByIdUseCase.js.map