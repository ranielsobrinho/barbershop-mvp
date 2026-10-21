import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { Service } from '../domain/entities/Service.js';
export interface CreateServiceInput {
    name: string;
    description?: string | null;
    priceCents: number;
    slotMin: number;
    active?: boolean;
}
export declare class CreateServiceUseCase {
    private readonly serviceRepository;
    constructor(serviceRepository: IServiceRepository);
    execute(input: CreateServiceInput): Promise<Service>;
}
//# sourceMappingURL=CreateServiceUseCase.d.ts.map