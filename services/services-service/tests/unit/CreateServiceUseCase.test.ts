import { describe, it, expect, beforeEach } from 'vitest';
import { CreateServiceUseCase } from '../../src/usecases/CreateServiceUseCase.js';
import { Service } from '../../src/domain/entities/Service.js';
import { ValidationError } from '../../src/domain/errors/DomainError.js';
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

describe('CreateServiceUseCase', () => {
  let useCase: CreateServiceUseCase;
  let repo: MockServiceRepository;

  beforeEach(() => {
    repo = new MockServiceRepository();
    useCase = new CreateServiceUseCase(repo);
  });

  it('cria serviço válido com todos os campos', async () => {
    const input = { name: 'Corte', description: 'Corte de cabelo', priceCents: 5000, slotMin: 30, active: true };
    const result = await useCase.execute(input);

    expect(result).toBeInstanceOf(Service);
    expect(result.name).toBe('Corte');
    expect(result.description).toBe('Corte de cabelo');
    expect(result.priceCents).toBe(5000);
    expect(result.slotMin).toBe(30);
    expect(result.active).toBe(true);
  });

  it('cria serviço com active default true', async () => {
    const input = { name: 'Corte', priceCents: 5000, slotMin: 30 };
    const result = await useCase.execute(input);
    expect(result.active).toBe(true);
  });

  it('trim no name', async () => {
    const input = { name: '  Corte  ', priceCents: 5000, slotMin: 30 };
    const result = await useCase.execute(input);
    expect(result.name).toBe('Corte');
  });

  it('trim na description', async () => {
    const input = { name: 'Corte', description: '  Descrição  ', priceCents: 5000, slotMin: 30 };
    const result = await useCase.execute(input);
    expect(result.description).toBe('Descrição');
  });

  it('description undefined vira null', async () => {
    const input = { name: 'Corte', priceCents: 5000, slotMin: 30 };
    const result = await useCase.execute(input);
    expect(result.description).toBeNull();
  });

  it('lança ValidationError para name vazio', async () => {
    const input = { name: '', priceCents: 5000, slotMin: 30 };
    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
  });

  it('lança ValidationError para name apenas espaços', async () => {
    const input = { name: '   ', priceCents: 5000, slotMin: 30 };
    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
  });

  it('lança ValidationError para priceCents negativo', async () => {
    const input = { name: 'Corte', priceCents: -1, slotMin: 30 };
    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
  });

  it('aceita priceCents = 0', async () => {
    const input = { name: 'Corte', priceCents: 0, slotMin: 30 };
    const result = await useCase.execute(input);
    expect(result.priceCents).toBe(0);
  });

  it('lança ValidationError para slotMin <= 0', async () => {
    const input = { name: 'Corte', priceCents: 5000, slotMin: 0 };
    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
  });

  it('lança ValidationError para slotMin negativo', async () => {
    const input = { name: 'Corte', priceCents: 5000, slotMin: -5 };
    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
  });
});
