import { describe, it, expect, beforeEach } from 'vitest';
import { ToggleServiceActiveUseCase } from '../../src/usecases/ToggleServiceActiveUseCase.js';
import { Service } from '../../src/domain/entities/Service.js';
import { ServiceNotFoundError } from '../../src/domain/errors/DomainError.js';
import { IServiceRepository } from '../../src/domain/repositories/IServiceRepository.js';

class MockServiceRepository implements IServiceRepository {
  private services: Map<string, Service> = new Map();

  async findAll(activeOnly?: boolean): Promise<Service[]> {
    let services = Array.from(this.services.values());
    if (activeOnly) services = services.filter(s => s.active);
    return services;
  }

  async findById(id: string): Promise<Service | null> {
    return this.services.get(id) || null;
  }

  async create(service: Service): Promise<Service> {
    this.services.set(service.id, service);
    return service;
  }

  async update(service: Service): Promise<Service> {
    this.services.set(service.id, service);
    return service;
  }

  async delete(id: string): Promise<void> {
    this.services.delete(id);
  }

  async hasAppointments(id: string): Promise<boolean> {
    return false;
  }

  addService(service: Service) {
    this.services.set(service.id, service);
  }
}

describe('ToggleServiceActiveUseCase', () => {
  let useCase: ToggleServiceActiveUseCase;
  let repo: MockServiceRepository;
  let existingService: Service;

  beforeEach(() => {
    repo = new MockServiceRepository();
    useCase = new ToggleServiceActiveUseCase(repo);
    existingService = Service.create('Corte', 5000, 30);
    repo.addService(existingService);
  });

  it('ativa serviço inativo', async () => {
    const inactive = Service.create('Barba', 3000, 20, null, false);
    repo.addService(inactive);

    await useCase.execute(inactive.id, true);

    const updated = await repo.findById(inactive.id);
    expect(updated?.active).toBe(true);
  });

  it('desativa serviço ativo', async () => {
    await useCase.execute(existingService.id, false);

    const updated = await repo.findById(existingService.id);
    expect(updated?.active).toBe(false);
  });

  it('lança ServiceNotFoundError para ID inexistente', async () => {
    await expect(useCase.execute('non-existent', true)).rejects.toThrow(ServiceNotFoundError);
  });

  it('outros campos permanecem inalterados ao alternar active', async () => {
    const originalName = existingService.name;
    const originalPrice = existingService.priceCents;
    const originalSlot = existingService.slotMin;

    await useCase.execute(existingService.id, false);

    const updated = await repo.findById(existingService.id);
    expect(updated?.name).toBe(originalName);
    expect(updated?.priceCents).toBe(originalPrice);
    expect(updated?.slotMin).toBe(originalSlot);
    expect(updated?.active).toBe(false);
  });
});
