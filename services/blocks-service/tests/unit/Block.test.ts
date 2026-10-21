import { describe, it, expect } from 'vitest';
import { Block } from '../../src/domain/entities/Block.js';

describe('Block entity', () => {
  it('cria bloqueio com ID gerado automaticamente', () => {
    const startsAt = new Date('2025-01-15T09:00:00');
    const endsAt = new Date('2025-01-15T12:00:00');
    const block = Block.create(startsAt, endsAt, 'Manutenção');

    expect(block.id).toBeDefined();
    expect(block.id.length).toBeGreaterThan(0);
    expect(block.startsAt).toEqual(startsAt);
    expect(block.endsAt).toEqual(endsAt);
    expect(block.reason).toBe('Manutenção');
    expect(block.createdAt).toBeInstanceOf(Date);
    expect(block.updatedAt).toBeInstanceOf(Date);
  });

  it('reason undefined vira null', () => {
    const block = Block.create(new Date('2025-01-15T09:00:00'), new Date('2025-01-15T12:00:00'));
    expect(block.reason).toBeNull();
  });

  it('trim no reason', () => {
    const block = Block.create(new Date('2025-01-15T09:00:00'), new Date('2025-01-15T12:00:00'), '  Manutenção  ');
    expect(block.reason).toBe('Manutenção');
  });

  it('isFullDay retorna true para duração >= 23h', () => {
    const startsAt = new Date('2025-01-15T00:00:00');
    const endsAt = new Date('2025-01-16T00:00:00'); // 24h
    const block = Block.create(startsAt, endsAt);
    expect(block.isFullDay).toBe(true);
  });

  it('isFullDay retorna true para exatamente 23h', () => {
    const startsAt = new Date('2025-01-15T00:00:00');
    const endsAt = new Date('2025-01-15T23:00:00'); // 23h
    const block = Block.create(startsAt, endsAt);
    expect(block.isFullDay).toBe(true);
  });

  it('isFullDay retorna false para duração < 23h', () => {
    const startsAt = new Date('2025-01-15T09:00:00');
    const endsAt = new Date('2025-01-15T12:00:00'); // 3h
    const block = Block.create(startsAt, endsAt);
    expect(block.isFullDay).toBe(false);
  });

  it('isFullDay retorna false para 22h59min', () => {
    const startsAt = new Date('2025-01-15T00:00:00');
    const endsAt = new Date('2025-01-15T22:59:00'); // 22h59min
    const block = Block.create(startsAt, endsAt);
    expect(block.isFullDay).toBe(false);
  });
});
