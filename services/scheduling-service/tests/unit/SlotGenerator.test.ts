import { describe, it, expect } from 'vitest';
import { SlotGenerator } from '../../src/domain/services/SlotGenerator';
import type { BusinessHoursSnapshot } from '../../src/domain/repositories/IBusinessHoursRepository';

const bh = (over: Partial<BusinessHoursSnapshot> = {}): BusinessHoursSnapshot => ({
  weekday: 1, opensAt: '09:00', closesAt: '18:00',
  breakStart: '12:00', breakEnd: '13:00', active: true,
  ...over,
});

describe('SlotGenerator', () => {
  const gen = new SlotGenerator();

  it('gera slots de 30 min do expediente', () => {
    const slots = gen.generate(bh(), 30);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].startMinutes).toBe(9 * 60); // 09:00
    expect(slots[0].endMinutes).toBe(9 * 60 + 30);
  });

  it('pula slots que cruzam o intervalo de almoço', () => {
    const slots = gen.generate(bh(), 30);
    // Slots 12:00-12:30 e 12:30-13:00 cruzam com almoço 12:00-13:00
    const crosses = slots.filter(s => s.startMinutes < 13 * 60 && s.endMinutes > 12 * 60);
    expect(crosses.length).toBe(0);
  });

  it('para serviço de 60 min ocupa dois slots (slot de 30)', () => {
    const slots30 = gen.generate(bh(), 30);
    const slots60 = gen.generate(bh(), 60);
    expect(slots60.length).toBeLessThan(slots30.length);
    // 60 min começa onde cabe inteiramente
    slots60.forEach(s => {
      expect(s.endMinutes - s.startMinutes).toBe(60);
      // não pode cruzar almoço
      expect(s.startMinutes >= 13 * 60 || s.endMinutes <= 12 * 60).toBe(true);
    });
  });

  it('não gera slots fora do expediente', () => {
    const slots = gen.generate(bh({ opensAt: '09:00', closesAt: '10:00', breakStart: null, breakEnd: null }), 30);
    slots.forEach(s => {
      expect(s.startMinutes).toBeGreaterThanOrEqual(9 * 60);
      expect(s.endMinutes).toBeLessThanOrEqual(10 * 60);
    });
  });

  it('retorna vazio para dia inativo', () => {
    expect(gen.generate(bh({ active: false }), 30)).toEqual([]);
  });

  it('retorna vazio se fecha antes de abrir', () => {
    expect(gen.generate(bh({ opensAt: '18:00', closesAt: '09:00' }), 30)).toEqual([]);
  });

  it('dia sem almoço gera todos os slots', () => {
    const slots = gen.generate(bh({ breakStart: null, breakEnd: null, opensAt: '09:00', closesAt: '10:00' }), 30);
    expect(slots.length).toBe(2); // 09:00 e 09:30
  });
});
