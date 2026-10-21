import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { Service } from '../domain/entities/Service.js';
import { ValidationError } from '../domain/errors/DomainError.js';

export interface CreateServiceInput {
  name: string;
  description?: string | null;
  priceCents: number;
  slotMin: number;
  active?: boolean;
}

export class CreateServiceUseCase {
  constructor(private readonly serviceRepository: IServiceRepository) {}

  async execute(input: CreateServiceInput): Promise<Service> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Nome é obrigatório');
    }
    if (input.priceCents < 0) {
      throw new ValidationError('Preço deve ser maior ou igual a zero');
    }
    if (input.slotMin <= 0) {
      throw new ValidationError('Duração deve ser maior que zero');
    }

    const service = Service.create(
      input.name.trim(),
      input.priceCents,
      input.slotMin,
      input.description?.trim() || null,
      input.active ?? true
    );

    return this.serviceRepository.create(service);
  }
}
