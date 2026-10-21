import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { Service } from '../domain/entities/Service.js';
export declare class ListActiveServicesUseCase {
    private readonly serviceRepository;
    constructor(serviceRepository: IServiceRepository);
    execute(): Promise<Service[]>;
}
//# sourceMappingURL=ListActiveServicesUseCase.d.ts.map