import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
export declare class DeleteServiceUseCase {
    private readonly serviceRepository;
    constructor(serviceRepository: IServiceRepository);
    execute(id: string): Promise<void>;
}
//# sourceMappingURL=DeleteServiceUseCase.d.ts.map