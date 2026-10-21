import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
export declare class ToggleServiceActiveUseCase {
    private readonly serviceRepository;
    constructor(serviceRepository: IServiceRepository);
    execute(id: string, active: boolean): Promise<void>;
}
//# sourceMappingURL=ToggleServiceActiveUseCase.d.ts.map