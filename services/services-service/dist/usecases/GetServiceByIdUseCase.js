import { ServiceNotFoundError } from '../domain/errors/DomainError.js';
export class GetServiceByIdUseCase {
    serviceRepository;
    constructor(serviceRepository) {
        this.serviceRepository = serviceRepository;
    }
    async execute(id) {
        const service = await this.serviceRepository.findById(id);
        if (!service)
            throw new ServiceNotFoundError(id);
        return service;
    }
}
//# sourceMappingURL=GetServiceByIdUseCase.js.map