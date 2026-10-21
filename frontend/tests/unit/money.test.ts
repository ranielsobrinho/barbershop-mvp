import { describe, it, expect } from 'vitest';
import { formatMoney } from '../../src/utils/money.js';

// O Intl.NumberFormat usa non-breaking space (U+00A0) entre símbolo e valor
const NBSP = '\u00A0';

describe('money utils', () => {
  describe('formatMoney', () => {
    it('formata centavos para reais brasileiros', () => {
      expect(formatMoney(5000)).toBe(`R$${NBSP}50,00`);
    });

    it('formata valor zero', () => {
      expect(formatMoney(0)).toBe(`R$${NBSP}0,00`);
    });

    it('formata valores com centavos', () => {
      expect(formatMoney(1234)).toBe(`R$${NBSP}12,34`);
      expect(formatMoney(100)).toBe(`R$${NBSP}1,00`);
      expect(formatMoney(99)).toBe(`R$${NBSP}0,99`);
    });

    it('formata valores grandes', () => {
      expect(formatMoney(100000)).toBe(`R$${NBSP}1.000,00`);
      expect(formatMoney(1234567)).toBe(`R$${NBSP}12.345,67`);
    });

    it('usa locale pt-BR (vírgula para decimais, ponto para milhares)', () => {
      expect(formatMoney(123456789)).toBe(`R$${NBSP}1.234.567,89`);
    });
  });
});
