import { ServiceNotFoundError, ServiceHasAppointmentsError } from '../domain/errors/DomainError.js';
export class DeleteServiceUseCase {
    serviceRepository;
    constructor(serviceRepository) {
        this.serviceRepository = serviceRepository;
    }
    async execute(id) {
        const existing = await this.serviceRepository.findById(id);
        if (!existing)
            throw new ServiceNotFoundError(id);
        const hasAppointments = await this.serviceRepository.hasAppointments(id);
        if (hasAppointments)
            throw new ServiceHasAppointmentsError(id);
        await this.serviceRepository.delete(id);
    }
}
//# sourceMappingURL=DeleteServiceUseCase.js.map