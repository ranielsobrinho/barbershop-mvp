import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { Service } from '../domain/entities/Service.js';
export interface UpdateServiceInput {
    id: string;
    name?: string;
    description?: string | null;
    priceCents?: number;
    slotMin?: number;
    active?: boolean;
}
export declare class UpdateServiceUseCase {
    private readonly serviceRepository;
    constructor(serviceRepository: IServiceRepository);
    execute(input: UpdateServiceInput): Promise<Service>;
}
//# sourceMappingURL=UpdateServiceUseCase.d.ts.map