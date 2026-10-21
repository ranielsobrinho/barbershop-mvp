import { IUserRepository } from '../domain/repositories/IUserRepository.js';
export interface ValidateTokenInput {
    token: string;
}
export interface ValidateTokenOutput {
    valid: boolean;
    userId: string;
    email: string;
}
export declare class ValidateTokenUseCase {
    private readonly userRepository;
    private readonly jwtSecret;
    constructor(userRepository: IUserRepository, jwtSecret: string);
    execute(input: ValidateTokenInput): Promise<ValidateTokenOutput>;
}
//# sourceMappingURL=ValidateTokenUseCase.d.ts.map