import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateServiceUseCase } from '../../src/usecases/UpdateServiceUseCase.js';
import { Service } from '../../src/domain/entities/Service.js';
import { ServiceNotFoundError, ValidationError } from '../../src/domain/errors/DomainError.js';
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

describe('UpdateServiceUseCase', () => {
  let useCase: UpdateServiceUseCase;
  let repo: MockServiceRepository;
  let existingService: Service;

  beforeEach(() => {
    repo = new MockServiceRepository();
    useCase = new UpdateServiceUseCase(repo);
    existingService = Service.create('Corte', 5000, 30, 'Descrição original');
    repo.addService(existingService);
  });

  it('atualiza name', async () => {
    const result = await useCase.execute({ id: existingService.id, name: 'Corte Premium' });
    expect(result.name).toBe('Corte Premium');
    expect(result.priceCents).toBe(5000);
    expect(result.description).toBe('Descrição original');
  });

  it('atualiza description', async () => {
    const result = await useCase.execute({ id: existingService.id, description: 'Nova descrição' });
    expect(result.description).toBe('Nova descrição');
  });

  it('atualiza description para null', async () => {
    const result = await useCase.execute({ id: existingService.id, description: null });
    expect(result.description).toBeNull();
  });

  it('atualiza priceCents', async () => {
    const result = await useCase.execute({ id: existingService.id, priceCents: 8000 });
    expect(result.priceCents).toBe(8000);
  });

  it('atualiza slotMin', async () => {
    const result = await useCase.execute({ id: existingService.id, slotMin: 45 });
    expect(result.slotMin).toBe(45);
  });

  it('atualiza active', async () => {
    const result = await useCase.execute({ id: existingService.id, active: false });
    expect(result.active).toBe(false);
  });

  it('atualiza múltiplos campos de uma vez', async () => {
    const result = await useCase.execute({ id: existingService.id, name: 'Novo', priceCents: 6000, active: false });
    expect(result.name).toBe('Novo');
    expect(result.priceCents).toBe(6000);
    expect(result.active).toBe(false);
    expect(result.description).toBe('Descrição original'); // unchanged
  });

  it('lança ServiceNotFoundError para ID inexistente', async () => {
    await expect(useCase.execute({ id: 'non-existent', name: 'Teste' })).rejects.toThrow(ServiceNotFoundError);
  });

  it('lança ValidationError para name vazio', async () => {
    await expect(useCase.execute({ id: existingService.id, name: '' })).rejects.toThrow(ValidationError);
  });

  it('lança ValidationError para name apenas espaços', async () => {
    await expect(useCase.execute({ id: existingService.id, name: '   ' })).rejects.toThrow(ValidationError);
  });

  it('lança ValidationError para priceCents negativo', async () => {
    await expect(useCase.execute({ id: existingService.id, priceCents: -1 })).rejects.toThrow(ValidationError);
  });

  it('aceita priceCents = 0', async () => {
    const result = await useCase.execute({ id: existingService.id, priceCents: 0 });
    expect(result.priceCents).toBe(0);
  });

  it('lança ValidationError para slotMin <= 0', async () => {
    await expect(useCase.execute({ id: existingService.id, slotMin: 0 })).rejects.toThrow(ValidationError);
  });

  it('não altera campos não fornecidos', async () => {
    const result = await useCase.execute({ id: existingService.id, name: 'Novo Nome' });
    expect(result.name).toBe('Novo Nome');
    expect(result.priceCents).toBe(5000);
    expect(result.slotMin).toBe(30);
    expect(result.active).toBe(true);
    expect(result.description).toBe('Descrição original');
  });

  it('updatedAt é atualizado', async () => {
    const originalUpdatedAt = existingService.updatedAt;
    // Small delay to ensure different timestamp
    await new Promise(r => setTimeout(r, 10));
    const result = await useCase.execute({ id: existingService.id, name: 'Novo' });
    expect(result.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('createdAt permanece inalterado', async () => {
    const result = await useCase.execute({ id: existingService.id, name: 'Novo' });
    expect(result.createdAt).toEqual(existingService.createdAt);
  });
});
