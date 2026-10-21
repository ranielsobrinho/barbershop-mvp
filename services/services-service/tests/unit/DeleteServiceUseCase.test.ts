import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteServiceUseCase } from '../../src/usecases/DeleteServiceUseCase.js';
import { Service } from '../../src/domain/entities/Service.js';
import { ServiceNotFoundError, ServiceHasAppointmentsError } from '../../src/domain/errors/DomainError.js';
import { IServiceRepository } from '../../src/domain/repositories/IServiceRepository.js';

class MockServiceRepository implements IServiceRepository {
  private services: Map<string, Service> = new Map();
  private appointmentsMap: Map<string, boolean> = new Map();

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
    return this.appointmentsMap.get(id) || false;
  }

  addService(service: Service) {
    this.services.set(service.id, service);
  }

  setHasAppointments(id: string, has: boolean) {
    this.appointmentsMap.set(id, has);
  }
}

describe('DeleteServiceUseCase', () => {
  let useCase: DeleteServiceUseCase;
  let repo: MockServiceRepository;
  let existingService: Service;

  beforeEach(() => {
    repo = new MockServiceRepository();
    useCase = new DeleteServiceUseCase(repo);
    existingService = Service.create('Corte', 5000, 30);
    repo.addService(existingService);
  });

  it('deleta serviço sem agendamentos', async () => {
    await expect(useCase.execute(existingService.id)).resolves.toBeUndefined();

    const found = await repo.findById(existingService.id);
    expect(found).toBeNull();
  });

  it('lança ServiceNotFoundError para ID inexistente', async () => {
    await expect(useCase.execute('non-existent')).rejects.toThrow(ServiceNotFoundError);
  });

  it('lança ServiceHasAppointmentsError quando serviço tem agendamentos', async () => {
    repo.setHasAppointments(existingService.id, true);

    await expect(useCase.execute(existingService.id)).rejects.toThrow(ServiceHasAppointmentsError);
  });

  it('não deleta quando lança ServiceHasAppointmentsError', async () => {
    repo.setHasAppointments(existingService.id, true);

    try {
      await useCase.execute(existingService.id);
    } catch {
      // expected
    }

    const found = await repo.findById(existingService.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(existingService.id);
  });
});
