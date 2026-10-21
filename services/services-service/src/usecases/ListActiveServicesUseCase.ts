import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { Service } from '../domain/entities/Service.js';

export class ListActiveServicesUseCase {
  constructor(private readonly serviceRepository: IServiceRepository) {}

  async execute(): Promise<Service[]> {
    return this.serviceRepository.findAll(true);
  }
}
