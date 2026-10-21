import { describe, it, expect } from 'vitest';
import { Service } from '../../src/domain/entities/Service.js';

describe('Service entity', () => {
  it('cria serviço com ID gerado automaticamente', () => {
    const service = Service.create('Corte', 5000, 30);
    expect(service.id).toBeDefined();
    expect(service.id.length).toBeGreaterThan(0);
    expect(service.name).toBe('Corte');
    expect(service.priceCents).toBe(5000);
    expect(service.slotMin).toBe(30);
    expect(service.active).toBe(true);
    expect(service.description).toBeNull();
    expect(service.createdAt).toBeInstanceOf(Date);
    expect(service.updatedAt).toBeInstanceOf(Date);
  });

  it('cria serviço com description e active=false', () => {
    const service = Service.create('Barba', 3000, 20, 'Aparar barba', false);
    expect(service.description).toBe('Aparar barba');
    expect(service.active).toBe(false);
  });

  it('trim no name', () => {
    const service = Service.create('  Corte  ', 5000, 30);
    expect(service.name).toBe('Corte');
  });

  it('trim na description', () => {
    const service = Service.create('Corte', 5000, 30, '  Aparar barba  ');
    expect(service.description).toBe('Aparar barba');
  });

  it('description undefined vira null', () => {
    const service = Service.create('Corte', 5000, 30, undefined);
    expect(service.description).toBeNull();
  });

  it('update retorna novo serviço com campos alterados', async () => {
    const original = Service.create('Corte', 5000, 30);
    // Small delay to ensure different timestamp
    await new Promise(r => setTimeout(r, 10));
    const updated = original.update('Corte Premium', undefined, 8000);

    expect(updated.id).toBe(original.id);
    expect(updated.name).toBe('Corte Premium');
    expect(updated.priceCents).toBe(8000);
    expect(updated.slotMin).toBe(30); // unchanged
    expect(updated.active).toBe(true); // unchanged
    expect(updated.description).toBeNull(); // unchanged
    expect(updated.createdAt).toEqual(original.createdAt);
    expect(updated.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
  });

  it('update com description null limpa a descrição', () => {
    const original = Service.create('Corte', 5000, 30, 'Descrição antiga');
    const updated = original.update(undefined, null);

    expect(updated.description).toBeNull();
  });

  it('update com active false', () => {
    const original = Service.create('Corte', 5000, 30);
    const updated = original.update(undefined, undefined, undefined, undefined, false);

    expect(updated.active).toBe(false);
  });
});
