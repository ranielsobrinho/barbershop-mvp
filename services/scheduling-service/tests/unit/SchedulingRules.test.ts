import { describe, it, expect } from 'vitest';
import { SchedulingRules } from '../../src/domain/services/SchedulingRules';
import { MinNoticeError, MaxDaysAheadError, ValidationError } from '../../src/domain/errors/DomainError';

describe('SchedulingRules', () => {
  const rules = new SchedulingRules({ minNoticeHours: 2, maxDaysAhead: 60 });
  const now = new Date('2026-10-19T10:00:00');

  describe('validateSlot - antecedência mínima', () => {
    it('rejeita horário com menos de 2h de antecedência', () => {
      const startsAt = new Date('2026-10-19T11:00:00'); // 1h depois
      expect(() => rules.validateSlot(startsAt, now)).toThrow(MinNoticeError);
    });

    it('aceita horário exatamente 2h depois', () => {
      const startsAt = new Date('2026-10-19T12:00:00');
      expect(() => rules.validateSlot(startsAt, now)).not.toThrow();
    });

    it('aceita horário futuro além do mínimo', () => {
      const startsAt = new Date('2026-10-20T09:00:00');
      expect(() => rules.validateSlot(startsAt, now)).not.toThrow();
    });
  });

  describe('validateSlot - janela máxima', () => {
    it('rejeita data além de 60 dias', () => {
      const startsAt = new Date('2026-12-25T09:00:00'); // >60 dias
      expect(() => rules.validateSlot(startsAt, now)).toThrow(MaxDaysAheadError);
    });

    it('aceita data dentro da janela de 60 dias', () => {
      const startsAt = new Date('2026-11-30T09:00:00'); // ~42 dias
      expect(() => rules.validateSlot(startsAt, now)).not.toThrow();
    });
  });

  describe('validateCustomerName', () => {
    it('aceita nome válido', () => {
      expect(() => rules.validateCustomerName('João Silva')).not.toThrow();
    });
    it('rejeita nome com menos de 2 caracteres', () => {
      expect(() => rules.validateCustomerName('A')).toThrow(ValidationError);
    });
    it('rejeita nome com mais de 80 caracteres', () => {
      expect(() => rules.validateCustomerName('A'.repeat(81))).toThrow(ValidationError);
    });
  });

  describe('validatePhone', () => {
    it('aceita celular com DDD (11 dígitos)', () => {
      expect(() => rules.validatePhone('(11) 98765-4321')).not.toThrow();
    });
    it('aceita telefone fixo (10 dígitos)', () => {
      expect(() => rules.validatePhone('(11) 3456-7890')).not.toThrow();
    });
    it('rejeita telefone sem DDD', () => {
      expect(() => rules.validatePhone('98765-4321')).toThrow(ValidationError);
    });
    it('rejeita telefone com menos de 10 dígitos', () => {
      expect(() => rules.validatePhone('1234567')).toThrow(ValidationError);
    });
  });

  describe('validateBookingDate', () => {
    it('rejeita data passada', () => {
      expect(() => rules.validateBookingDate(new Date(2026, 9, 18), now)).toThrow(ValidationError);
    });
    it('aceita data de hoje', () => {
      expect(() => rules.validateBookingDate(new Date(2026, 9, 19), now)).not.toThrow();
    });
    it('aceita data futura', () => {
      expect(() => rules.validateBookingDate(new Date(2026, 9, 25), now)).not.toThrow();
    });
  });
});
