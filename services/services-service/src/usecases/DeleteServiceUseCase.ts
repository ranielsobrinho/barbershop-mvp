import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { ServiceNotFoundError, ServiceHasAppointmentsError } from '../domain/errors/DomainError.js';

export class DeleteServiceUseCase {
  constructor(private readonly serviceRepository: IServiceRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.serviceRepository.findById(id);
    if (!existing) throw new ServiceNotFoundError(id);

    const hasAppointments = await this.serviceRepository.hasAppointments(id);
    if (hasAppointments) throw new ServiceHasAppointmentsError(id);

    await this.serviceRepository.delete(id);
  }
}
