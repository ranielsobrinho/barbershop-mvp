import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { ServiceNotFoundError } from '../domain/errors/DomainError.js';

export class ToggleServiceActiveUseCase {
  constructor(private readonly serviceRepository: IServiceRepository) {}

  async execute(id: string, active: boolean): Promise<void> {
    const existing = await this.serviceRepository.findById(id);
    if (!existing) throw new ServiceNotFoundError(id);

    const updated = existing.update(undefined, undefined, undefined, undefined, active);
    await this.serviceRepository.update(updated);
  }
}
