import { TokenExpiredError, TokenInvalidError, UserNotFoundError } from '../domain/errors/DomainError.js';
import jwt from 'jsonwebtoken';
export class ValidateTokenUseCase {
    userRepository;
    jwtSecret;
    constructor(userRepository, jwtSecret) {
        this.userRepository = userRepository;
        this.jwtSecret = jwtSecret;
    }
    async execute(input) {
        let payload;
        try {
            payload = jwt.verify(input.token, this.jwtSecret);
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new TokenExpiredError();
            }
            throw new TokenInvalidError();
        }
        const userId = payload.sub;
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
//# sourceMappingURL=ValidateTokenUseCase.js.map