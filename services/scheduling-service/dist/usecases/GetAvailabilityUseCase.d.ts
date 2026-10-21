import { AvailabilityService, AvailableSlot } from '../domain/services/AvailabilityService.js';
import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
export declare class GetAvailabilityUseCase {
    private readonly availability;
    private readonly serviceRepo;
    constructor(availability: AvailabilityService, serviceRepo: IServiceRepository);
    execute(dateStr: string, serviceId: string): Promise<AvailableSlot[]>;
}
