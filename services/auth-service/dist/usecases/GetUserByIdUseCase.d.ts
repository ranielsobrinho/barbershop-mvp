import { IUserRepository } from '../domain/repositories/IUserRepository.js';
export interface GetUserByIdInput {
    userId: string;
}
export interface GetUserByIdOutput {
    id: string;
    email: string;
}
export declare class GetUserByIdUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(input: GetUserByIdInput): Promise<GetUserByIdOutput>;
}
//# sourceMappingURL=GetUserByIdUseCase.d.ts.map