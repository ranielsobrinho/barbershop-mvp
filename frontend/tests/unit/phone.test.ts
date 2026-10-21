import { describe, it, expect } from 'vitest';
import { maskPhone, isValidPhone, formatPhone } from '../../src/utils/phone.js';

describe('phone utils', () => {
  describe('maskPhone', () => {
    it('retorna vazio para string vazia', () => {
      expect(maskPhone('')).toBe('');
    });

    it('retorna apenas DDD parcial para 1-2 dígitos', () => {
      expect(maskPhone('1')).toBe('(1');
      expect(maskPhone('11')).toBe('(11');
    });

    it('formata com DDD e prefixo para 3-6 dígitos', () => {
      expect(maskPhone('119')).toBe('(11) 9');
      expect(maskPhone('1198')).toBe('(11) 98');
      expect(maskPhone('11987')).toBe('(11) 987');
      expect(maskPhone('119876')).toBe('(11) 9876');
    });

    it('formata telefone fixo (10 dígitos) com hífen', () => {
      expect(maskPhone('1198765432')).toBe('(11) 9876-5432');
    });

    it('formata celular (11 dígitos) com hífen', () => {
      expect(maskPhone('11987654321')).toBe('(11) 98765-4321');
    });

    it('trunca em 11 dígitos', () => {
      expect(maskPhone('11987654321999')).toBe('(11) 98765-4321');
    });

    it('remove caracteres não numéricos', () => {
      expect(maskPhone('(11) 98765-4321')).toBe('(11) 98765-4321');
      expect(maskPhone('11 98765 4321')).toBe('(11) 98765-4321');
      // +55 11 98765-4321 -> 5511987654321 (13 dígitos) -> trunca para 11 -> 55119876543
      expect(maskPhone('+55 11 98765-4321')).toBe('(55) 11987-6543');
    });
  });

  describe('isValidPhone', () => {
    it('retorna true para telefone fixo válido (10 dígitos)', () => {
      expect(isValidPhone('1198765432')).toBe(true);
      expect(isValidPhone('(11) 9876-5432')).toBe(true);
    });

    it('retorna true para celular válido (11 dígitos)', () => {
      expect(isValidPhone('11987654321')).toBe(true);
      expect(isValidPhone('(11) 98765-4321')).toBe(true);
    });

    it('retorna false para menos de 10 dígitos', () => {
      expect(isValidPhone('119876543')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });

    it('retorna false para mais de 11 dígitos', () => {
      expect(isValidPhone('119876543212')).toBe(false);
    });

    it('ignora caracteres não numéricos', () => {
      expect(isValidPhone('(11) 98765-4321')).toBe(true);
      expect(isValidPhone('+55 11 98765-4321')).toBe(false); // 13 dígitos após limpeza
    });
  });

  describe('formatPhone', () => {
    it('delega para maskPhone', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    });
  });
});
