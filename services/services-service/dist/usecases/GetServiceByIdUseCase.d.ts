import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { Service } from '../domain/entities/Service.js';
export declare class GetServiceByIdUseCase {
    private readonly serviceRepository;
    constructor(serviceRepository: IServiceRepository);
    execute(id: string): Promise<Service>;
}
//# sourceMappingURL=GetServiceByIdUseCase.d.ts.map