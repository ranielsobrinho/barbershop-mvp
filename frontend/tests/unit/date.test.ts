import { describe, it, expect } from 'vitest';
import { formatFullDate, formatTime, toDateString, monthString, WEEKDAYS_SHORT, WEEKDAYS_FULL, MONTHS } from '../../src/utils/date.js';

describe('date utils', () => {
  describe('constants', () => {
    it('WEEKDAYS_SHORT tem 7 dias começando com Dom', () => {
      expect(WEEKDAYS_SHORT).toHaveLength(7);
      expect(WEEKDAYS_SHORT[0]).toBe('Dom');
      expect(WEEKDAYS_SHORT[6]).toBe('Sáb');
    });

    it('WEEKDAYS_FULL tem 7 dias completos', () => {
      expect(WEEKDAYS_FULL).toHaveLength(7);
      expect(WEEKDAYS_FULL[0]).toBe('Domingo');
      expect(WEEKDAYS_FULL[6]).toBe('Sábado');
    });

    it('MONTHS tem 12 meses', () => {
      expect(MONTHS).toHaveLength(12);
      expect(MONTHS[0]).toBe('Janeiro');
      expect(MONTHS[11]).toBe('Dezembro');
    });
  });

  describe('formatFullDate', () => {
    it('formata data ISO string para formato completo em pt-BR', () => {
      const result = formatFullDate('2025-01-15T10:30:00');
      expect(result).toContain('quarta-feira');
      expect(result).toContain('15');
      expect(result).toContain('janeiro');
      expect(result).toContain('2025');
    });

    it('formata objeto Date para formato completo', () => {
      const date = new Date('2025-06-20T15:00:00');
      const result = formatFullDate(date);
      expect(result).toContain('sexta-feira');
      expect(result).toContain('20');
      expect(result).toContain('junho');
      expect(result).toContain('2025');
    });
  });

  describe('formatTime', () => {
    it('extrai hora e minuto de string ISO', () => {
      expect(formatTime('2025-01-15T09:30:00')).toBe('09:30');
      expect(formatTime('2025-01-15T14:05:00')).toBe('14:05');
      expect(formatTime('2025-01-15T23:59:00')).toBe('23:59');
    });
  });

  describe('toDateString', () => {
    it('converte Date para YYYY-MM-DD', () => {
      const date = new Date('2025-01-15T10:30:00');
      expect(toDateString(date)).toBe('2025-01-15');
    });

    it('usa hora local do Date', () => {
      const date = new Date(2025, 5, 20); // 20 de junho de 2025
      expect(toDateString(date)).toBe('2025-06-20');
    });
  });

  describe('monthString', () => {
    it('converte Date para YYYY-MM', () => {
      const date = new Date('2025-01-15T10:30:00');
      expect(monthString(date)).toBe('2025-01');
    });

    it('funciona para dezembro', () => {
      const date = new Date('2025-12-31T23:59:59');
      expect(monthString(date)).toBe('2025-12');
    });
  });
});
