import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { Service } from '../domain/entities/Service.js';
import { ServiceNotFoundError, ValidationError } from '../domain/errors/DomainError.js';

export interface UpdateServiceInput {
  id: string;
  name?: string;
  description?: string | null;
  priceCents?: number;
  slotMin?: number;
  active?: boolean;
}

export class UpdateServiceUseCase {
  constructor(private readonly serviceRepository: IServiceRepository) {}

  async execute(input: UpdateServiceInput): Promise<Service> {
    const existing = await this.serviceRepository.findById(input.id);
    if (!existing) throw new ServiceNotFoundError(input.id);

    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new ValidationError('Nome não pode ser vazio');
    }
    if (input.priceCents !== undefined && input.priceCents < 0) {
      throw new ValidationError('Preço deve ser maior ou igual a zero');
    }
    if (input.slotMin !== undefined && input.slotMin <= 0) {
      throw new ValidationError('Duração deve ser maior que zero');
    }

    const updated = existing.update(
      input.name !== undefined ? input.name.trim() : undefined,
      input.description !== undefined ? (input.description?.trim() ?? null) : undefined,
      input.priceCents,
      input.slotMin,
      input.active
    );

    return this.serviceRepository.update(updated);
  }
}
