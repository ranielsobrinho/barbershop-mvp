import { describe, it, expect, beforeEach } from 'vitest';
import { GetServiceByIdUseCase } from '../../src/usecases/GetServiceByIdUseCase.js';
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

describe('GetServiceByIdUseCase', () => {
  let useCase: GetServiceByIdUseCase;
  let repo: MockServiceRepository;
  let existingService: Service;

  beforeEach(() => {
    repo = new MockServiceRepository();
    useCase = new GetServiceByIdUseCase(repo);
    existingService = Service.create('Corte', 5000, 30, 'Descrição');
    repo.addService(existingService);
  });

  it('retorna serviço existente', async () => {
    const result = await useCase.execute(existingService.id);

    expect(result).toBeInstanceOf(Service);
    expect(result.id).toBe(existingService.id);
    expect(result.name).toBe('Corte');
    expect(result.priceCents).toBe(5000);
    expect(result.description).toBe('Descrição');
  });

  it('retorna serviço inativo também', async () => {
    const inactive = Service.create('Barba', 3000, 20, null, false);
    repo.addService(inactive);

    const result = await useCase.execute(inactive.id);
    expect(result.active).toBe(false);
  });

  it('lança ServiceNotFoundError para ID inexistente', async () => {
    await expect(useCase.execute('non-existent')).rejects.toThrow(ServiceNotFoundError);
  });
});
