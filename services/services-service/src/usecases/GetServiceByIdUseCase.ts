import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { Service } from '../domain/entities/Service.js';
import { ServiceNotFoundError } from '../domain/errors/DomainError.js';

export class GetServiceByIdUseCase {
  constructor(private readonly serviceRepository: IServiceRepository) {}

  async execute(id: string): Promise<Service> {
    const service = await this.serviceRepository.findById(id);
    if (!service) throw new ServiceNotFoundError(id);
    return service;
  }
}
