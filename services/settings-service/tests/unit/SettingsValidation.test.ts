import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const updateSchema = z.object({
  minNoticeHours: z.number().int().min(0).max(72).optional(),
  maxDaysAhead: z.number().int().min(1).max(365).optional(),
  heroText: z.string().max(500).nullable().optional(),
  heroImageUrl: z.string().url().max(500).nullable().optional(),
});

describe('Settings validation schema', () => {
  describe('minNoticeHours', () => {
    it('aceita valor 0', () => {
      const result = updateSchema.parse({ minNoticeHours: 0 });
      expect(result.minNoticeHours).toBe(0);
    });

    it('aceita valor 72 (máximo)', () => {
      const result = updateSchema.parse({ minNoticeHours: 72 });
      expect(result.minNoticeHours).toBe(72);
    });

    it('rejeita valor negativo', () => {
      expect(() => updateSchema.parse({ minNoticeHours: -1 })).toThrow(z.ZodError);
    });

    it('rejeita valor > 72', () => {
      expect(() => updateSchema.parse({ minNoticeHours: 73 })).toThrow(z.ZodError);
    });

    it('rejeita valor não inteiro', () => {
      expect(() => updateSchema.parse({ minNoticeHours: 1.5 })).toThrow(z.ZodError);
    });

    it('aceita omitido (optional)', () => {
      const result = updateSchema.parse({});
      expect(result.minNoticeHours).toBeUndefined();
    });
  });

  describe('maxDaysAhead', () => {
    it('aceita valor 1 (mínimo)', () => {
      const result = updateSchema.parse({ maxDaysAhead: 1 });
      expect(result.maxDaysAhead).toBe(1);
    });

    it('aceita valor 365 (máximo)', () => {
      const result = updateSchema.parse({ maxDaysAhead: 365 });
      expect(result.maxDaysAhead).toBe(365);
    });

    it('rejeita valor 0', () => {
      expect(() => updateSchema.parse({ maxDaysAhead: 0 })).toThrow(z.ZodError);
    });

    it('rejeita valor negativo', () => {
      expect(() => updateSchema.parse({ maxDaysAhead: -1 })).toThrow(z.ZodError);
    });

    it('rejeita valor > 365', () => {
      expect(() => updateSchema.parse({ maxDaysAhead: 366 })).toThrow(z.ZodError);
    });

    it('rejeita valor não inteiro', () => {
      expect(() => updateSchema.parse({ maxDaysAhead: 1.5 })).toThrow(z.ZodError);
    });

    it('aceita omitido (optional)', () => {
      const result = updateSchema.parse({});
      expect(result.maxDaysAhead).toBeUndefined();
    });
  });

  describe('heroText', () => {
    it('aceita string válida', () => {
      const result = updateSchema.parse({ heroText: 'Bem-vindo à barbearia' });
      expect(result.heroText).toBe('Bem-vindo à barbearia');
    });

    it('aceita null', () => {
      const result = updateSchema.parse({ heroText: null });
      expect(result.heroText).toBeNull();
    });

    it('aceita omitido', () => {
      const result = updateSchema.parse({});
      expect(result.heroText).toBeUndefined();
    });

    it('rejeita string > 500 caracteres', () => {
      const longText = 'a'.repeat(501);
      expect(() => updateSchema.parse({ heroText: longText })).toThrow(z.ZodError);
    });

    it('aceita string com exatamente 500 caracteres', () => {
      const text = 'a'.repeat(500);
      const result = updateSchema.parse({ heroText: text });
      expect(result.heroText).toBe(text);
    });
  });

  describe('heroImageUrl', () => {
    it('aceita URL válida', () => {
      const result = updateSchema.parse({ heroImageUrl: 'https://example.com/image.jpg' });
      expect(result.heroImageUrl).toBe('https://example.com/image.jpg');
    });

    it('aceita null', () => {
      const result = updateSchema.parse({ heroImageUrl: null });
      expect(result.heroImageUrl).toBeNull();
    });

    it('aceita omitido', () => {
      const result = updateSchema.parse({});
      expect(result.heroImageUrl).toBeUndefined();
    });

    it('rejeita URL inválida', () => {
      expect(() => updateSchema.parse({ heroImageUrl: 'not-a-url' })).toThrow(z.ZodError);
    });

    it('rejeita URL > 500 caracteres', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(481); // 501 chars total
      expect(() => updateSchema.parse({ heroImageUrl: longUrl })).toThrow(z.ZodError);
    });

    it('aceita URL com exatamente 500 caracteres', () => {
      const url = 'https://example.com/' + 'a'.repeat(480); // 500 chars total
      const result = updateSchema.parse({ heroImageUrl: url });
      expect(result.heroImageUrl).toBe(url);
    });
  });

  describe('objeto completo', () => {
    it('aceita atualização parcial', () => {
      const result = updateSchema.parse({ minNoticeHours: 3 });
      expect(result).toEqual({ minNoticeHours: 3, maxDaysAhead: undefined, heroText: undefined, heroImageUrl: undefined });
    });

    it('aceita atualização de todos os campos', () => {
      const input = { minNoticeHours: 4, maxDaysAhead: 30, heroText: 'Texto', heroImageUrl: 'https://example.com/img.jpg' };
      const result = updateSchema.parse(input);
      expect(result).toEqual(input);
    });
  });
});
