import { InvalidCredentialsError } from '../domain/errors/DomainError.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
export class LoginUseCase {
    userRepository;
    jwtSecret;
    jwtExpiresIn;
    constructor(userRepository, jwtSecret, jwtExpiresIn) {
        this.userRepository = userRepository;
        this.jwtSecret = jwtSecret;
        this.jwtExpiresIn = jwtExpiresIn;
    }
    async execute(input) {
        const user = await this.userRepository.findByEmail(input.email);
        if (!user) {
            throw new InvalidCredentialsError();
        }
        const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new InvalidCredentialsError();
        }
        const token = jwt.sign({ sub: user.id, email: user.email }, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        };
    }
}
//# sourceMappingURL=LoginUseCase.js.map