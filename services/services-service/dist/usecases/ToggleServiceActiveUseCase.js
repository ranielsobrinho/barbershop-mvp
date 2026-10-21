import { ServiceNotFoundError } from '../domain/errors/DomainError.js';
export class ToggleServiceActiveUseCase {
    serviceRepository;
    constructor(serviceRepository) {
        this.serviceRepository = serviceRepository;
    }
    async execute(id, active) {
        const existing = await this.serviceRepository.findById(id);
        if (!existing)
            throw new ServiceNotFoundError(id);
        const updated = existing.update(undefined, undefined, undefined, undefined, active);
        await this.serviceRepository.update(updated);
    }
}
//# sourceMappingURL=ToggleServiceActiveUseCase.js.map