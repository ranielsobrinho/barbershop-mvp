import { describe, it, expect } from 'vitest';
import { formatMoney, sanitizePriceInput } from '../../src/utils/money.js';

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


describe('sanitizePriceInput', () => {
  it('removes letters and currency symbols while preserving decimal input', () => {
    expect(sanitizePriceInput('R$45abc,90')).toBe('45,90');
  });

  it('accepts digits without a decimal separator', () => {
    expect(sanitizePriceInput('12345')).toBe('12345');
  });

  it('accepts a pasted Brazilian thousands and decimal format', () => {
    expect(sanitizePriceInput('R$ 1.234,56')).toBe('1234,56');
  });

  it('supports dot decimals and treats three trailing digits as grouping', () => {
    expect(sanitizePriceInput('45.678')).toBe('45678');
    expect(sanitizePriceInput('45.67')).toBe('45.67');
  });

  it('returns an empty value when input contains no digits', () => {
    expect(sanitizePriceInput('letters')).toBe('');
  });
});
