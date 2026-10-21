import { AvailabilityService, AvailableSlot } from '../domain/services/AvailabilityService.js';
import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { NotFoundError, ValidationError } from '../domain/errors/DomainError.js';
import { parseISO } from 'date-fns';

export class GetAvailabilityUseCase {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly serviceRepo: IServiceRepository
  ) {}

  async execute(dateStr: string, serviceId: string): Promise<AvailableSlot[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new ValidationError('Data deve estar no formato YYYY-MM-DD');
    }

    const service = await this.serviceRepo.findById(serviceId);
    if (!service) throw new NotFoundError('Serviço', serviceId);
    if (!service.active) throw new ValidationError('Serviço não está ativo');

    const date = parseISO(dateStr);
    return this.availability.getAvailableSlots(date, service.slotMin);
  }
}
