import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const hoursSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  opensAt: z.string().regex(/^\d{2}:\d{2}$/),
  closesAt: z.string().regex(/^\d{2}:\d{2}$/),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  breakEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  active: z.boolean(),
});

const updateSchema = z.object({ hours: z.array(hoursSchema).min(7).max(7) });

describe('BusinessHours validation schemas', () => {
  describe('hoursSchema', () => {
    it('aceita horário válido completo', () => {
      const input = {
        weekday: 1,
        opensAt: '09:00',
        closesAt: '18:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        active: true,
      };
      const result = hoursSchema.parse(input);
      expect(result).toEqual(input);
    });

    it('aceita horário sem intervalo de almoço', () => {
      const input = {
        weekday: 1,
        opensAt: '09:00',
        closesAt: '18:00',
        breakStart: null,
        breakEnd: null,
        active: true,
      };
      const result = hoursSchema.parse(input);
      expect(result.breakStart).toBeNull();
      expect(result.breakEnd).toBeNull();
    });

    it('aceita breakStart/breakEnd omitidos (optional)', () => {
      const input = {
        weekday: 1,
        opensAt: '09:00',
        closesAt: '18:00',
        active: true,
      };
      const result = hoursSchema.parse(input);
      expect(result.breakStart).toBeUndefined();
      expect(result.breakEnd).toBeUndefined();
    });

    it('rejeita weekday < 0', () => {
      const input = { weekday: -1, opensAt: '09:00', closesAt: '18:00', active: true };
      expect(() => hoursSchema.parse(input)).toThrow(z.ZodError);
    });

    it('rejeita weekday > 6', () => {
      const input = { weekday: 7, opensAt: '09:00', closesAt: '18:00', active: true };
      expect(() => hoursSchema.parse(input)).toThrow(z.ZodError);
    });

    it('rejeita weekday não inteiro', () => {
      const input = { weekday: 1.5, opensAt: '09:00', closesAt: '18:00', active: true };
      expect(() => hoursSchema.parse(input)).toThrow(z.ZodError);
    });

    it('rejeita opensAt formato inválido', () => {
      const input = { weekday: 1, opensAt: '9:00', closesAt: '18:00', active: true };
      expect(() => hoursSchema.parse(input)).toThrow(z.ZodError);
    });

    it('rejeita closesAt formato inválido', () => {
      const input = { weekday: 1, opensAt: '09:00', closesAt: '18:0', active: true };
      expect(() => hoursSchema.parse(input)).toThrow(z.ZodError);
    });

    it('rejeita breakStart formato inválido', () => {
      const input = { weekday: 1, opensAt: '09:00', closesAt: '18:00', breakStart: '12:0', active: true };
      expect(() => hoursSchema.parse(input)).toThrow(z.ZodError);
    });

    it('rejeita active não booleano', () => {
      const input = { weekday: 1, opensAt: '09:00', closesAt: '18:00', active: 'true' };
      expect(() => hoursSchema.parse(input)).toThrow(z.ZodError);
    });
  });

  describe('updateSchema', () => {
    it('aceita array com exatamente 7 dias', () => {
      const days = Array.from({ length: 7 }, (_, i) => ({
        weekday: i,
        opensAt: '09:00',
        closesAt: '18:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        active: i < 5, // seg-sex ativo, sab-dom inativo
      }));
      const result = updateSchema.parse({ hours: days });
      expect(result.hours).toHaveLength(7);
    });

    it('rejeita array com menos de 7 dias', () => {
      const days = Array.from({ length: 6 }, (_, i) => ({
        weekday: i,
        opensAt: '09:00',
        closesAt: '18:00',
        active: true,
      }));
      expect(() => updateSchema.parse({ hours: days })).toThrow(z.ZodError);
    });

    it('rejeita array com mais de 7 dias', () => {
      const days = Array.from({ length: 8 }, (_, i) => ({
        weekday: i % 7,
        opensAt: '09:00',
        closesAt: '18:00',
        active: true,
      }));
      expect(() => updateSchema.parse({ hours: days })).toThrow(z.ZodError);
    });

    it('rejeita array vazio', () => {
      expect(() => updateSchema.parse({ hours: [] })).toThrow(z.ZodError);
    });
  });
});
