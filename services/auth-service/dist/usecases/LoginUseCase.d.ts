import { IUserRepository } from '../domain/repositories/IUserRepository.js';
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
export declare class LoginUseCase {
    private readonly userRepository;
    private readonly jwtSecret;
    private readonly jwtExpiresIn;
    constructor(userRepository: IUserRepository, jwtSecret: string, jwtExpiresIn: string);
    execute(input: LoginInput): Promise<LoginOutput>;
}
//# sourceMappingURL=LoginUseCase.d.ts.map