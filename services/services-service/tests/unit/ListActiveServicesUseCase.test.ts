import { describe, it, expect, beforeEach } from 'vitest';
import { ListActiveServicesUseCase } from '../../src/usecases/ListActiveServicesUseCase.js';
import { Service } from '../../src/domain/entities/Service.js';
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

describe('ListActiveServicesUseCase', () => {
  let useCase: ListActiveServicesUseCase;
  let repo: MockServiceRepository;

  beforeEach(() => {
    repo = new MockServiceRepository();
    useCase = new ListActiveServicesUseCase(repo);
  });

  it('retorna apenas serviços ativos', async () => {
    const active1 = Service.create('Corte', 5000, 30);
    const active2 = Service.create('Barba', 3000, 20);
    const inactive = Service.create('Penteado', 4000, 40, null, false);
    repo.addService(active1);
    repo.addService(active2);
    repo.addService(inactive);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toEqual(expect.arrayContaining([active1.id, active2.id]));
    expect(result.every(s => s.active)).toBe(true);
  });

  it('retorna array vazio quando não há serviços ativos', async () => {
    const inactive = Service.create('Penteado', 4000, 40, null, false);
    repo.addService(inactive);

    const result = await useCase.execute();
    expect(result).toEqual([]);
  });

  it('retorna array vazio quando não há serviços', async () => {
    const result = await useCase.execute();
    expect(result).toEqual([]);
  });
});
