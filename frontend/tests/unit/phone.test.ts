import { describe, it, expect } from 'vitest';
import { maskPhone, isValidPhone, formatPhone, mapCursorPosition, correctCursorPosition } from '../../src/utils/phone.js';

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

  describe('mapCursorPosition', () => {
    describe('casos básicos', () => {
      it('cursor no início (zero dígitos antes) -> posição após "("', () => {
        // raw: "" | cursor: 0 -> masked: ""
        expect(mapCursorPosition('', 0, '')).toBe(0);
        
        // raw: "1" | cursor: 0 -> masked: "(1"
        expect(mapCursorPosition('1', 0, '(1')).toBe(1); // após "("
        
        // raw: "11" | cursor: 0 -> masked: "(11"
        expect(mapCursorPosition('11', 0, '(11')).toBe(1); // após "("
      });

      it('cursor após 1 dígito -> após primeiro dígito na máscara', () => {
        // raw: "1" | cursor: 1 -> masked: "(1"
        expect(mapCursorPosition('1', 1, '(1')).toBe(2); // após "1"
        
        // raw: "11" | cursor: 1 -> masked: "(11"
        expect(mapCursorPosition('11', 1, '(11')).toBe(2); // após primeiro "1"
      });

      it('cursor após 2 dígitos (DDD completo) -> após DDD na máscara', () => {
        // raw: "11" | cursor: 2 -> masked: "(11"
        expect(mapCursorPosition('11', 2, '(11')).toBe(3); // após "11" (final da máscara para 2 dígitos)
        
        // raw: "119" | cursor: 2 -> masked: "(11) 9"
        // 2 dígitos antes do cursor -> posição mais à direita com 2 dígitos na máscara
        // "(11) 9": posições com 2 dígitos antes = 3 (após 2º dígito), 4 (após ')'), 5 (após espaço)
        // Mais à direita = 5 (após espaço, antes do 9)
        expect(mapCursorPosition('119', 2, '(11) 9')).toBe(5);
      });
    });

    describe('cursor no meio da máscara', () => {
      it('cursor após 3 dígitos (DDD + 1) -> após primeiro dígito do número', () => {
        // raw: "119" | cursor: 3 -> masked: "(11) 9"
        expect(mapCursorPosition('119', 3, '(11) 9')).toBe(6); // após "9"
      });

      it('cursor após 6 dígitos (DDD + 4) -> após 4 dígitos do prefixo', () => {
        // raw: "119876" | cursor: 6 -> masked: "(11) 9876"
        // 6 dígitos antes do cursor -> final da máscara (length = 9)
        expect(mapCursorPosition('119876', 6, '(11) 9876')).toBe(9);
      });

      it('cursor após 7 dígitos (DDD + 4 + 1) -> após hífen do telefone fixo', () => {
        // raw: "1198765" | cursor: 7 -> masked: "(11) 9876-5"
        expect(mapCursorPosition('1198765', 7, '(11) 9876-5')).toBe(11); // após "5"
      });

      it('cursor após 10 dígitos (telefone fixo completo) -> final da máscara', () => {
        // raw: "1198765432" | cursor: 10 -> masked: "(11) 9876-5432"
        expect(mapCursorPosition('1198765432', 10, '(11) 9876-5432')).toBe(14);
      });

      it('cursor após 11 dígitos (celular completo) -> final da máscara', () => {
        // raw: "11987654321" | cursor: 11 -> masked: "(11) 98765-4321"
        expect(mapCursorPosition('11987654321', 11, '(11) 98765-4321')).toBe(15);
      });
    });

    describe('casos de borda - cursor no final', () => {
      it('cursor no final do raw value (igual ao length) -> final da máscara', () => {
        expect(mapCursorPosition('119', 3, '(11) 9')).toBe(6);
        expect(mapCursorPosition('119876', 6, '(11) 9876')).toBe(9);
        expect(mapCursorPosition('1198765432', 10, '(11) 9876-5432')).toBe(14);
        expect(mapCursorPosition('11987654321', 11, '(11) 98765-4321')).toBe(15);
      });

      it('cursor além do final do raw value (clamped) -> final da máscara', () => {
        expect(mapCursorPosition('119', 5, '(11) 9')).toBe(6);
        expect(mapCursorPosition('11987654321', 15, '(11) 98765-4321')).toBe(15);
      });
    });

    describe('casos de borda - deleção/backspace', () => {
      it('deleção no meio: cursor volta para posição correta', () => {
        // Usuário tinha "(11) 9876-5432" (raw: "1198765432", cursor: 10)
        // Apaga um dígito -> raw: "119876543", cursor: 9
        // masked: "(11) 9876-543"
        expect(mapCursorPosition('119876543', 9, '(11) 9876-543')).toBe(13);
      });

      it('deleção do último dígito do DDD', () => {
        // raw: "119" -> cursor: 3 -> masked: "(11) 9"
        // Apaga "9" -> raw: "11", cursor: 2 -> masked: "(11"
        expect(mapCursorPosition('11', 2, '(11')).toBe(3);
      });

      it('deleção até string vazia', () => {
        // raw: "1", cursor: 1 -> masked: "(1"
        // Apaga "1" -> raw: "", cursor: 0 -> masked: ""
        expect(mapCursorPosition('', 0, '')).toBe(0);
      });
    });

    describe('casos com pontuação no raw value', () => {
      it('raw value já contém parênteses e hífen', () => {
        // Usuário cola "(11) 9876-5432" -> raw: "(11) 9876-5432", cursor no final (14)
        // masked: "(11) 9876-5432"
        expect(mapCursorPosition('(11) 9876-5432', 14, '(11) 9876-5432')).toBe(14);
      });

      it('raw value com espaços', () => {
        // Usuário digita "11 9876 5432" -> raw: "11 9876 5432", cursor: 12
        // masked: "(11) 9876-5432"
        expect(mapCursorPosition('11 9876 5432', 12, '(11) 9876-5432')).toBe(14);
      });

      it('cursor no meio de pontuação no raw', () => {
        // raw: "(11) 9" | cursor: 5 (após espaço, antes do 9)
        // dígitos antes do cursor: "(11) ".replace(/\D/g, '') = "11" -> 2 dígitos
        // masked: "(11) 9" -> posições com 2 dígitos antes: 3, 4, 5 -> mais à direita = 5
        expect(mapCursorPosition('(11) 9', 5, '(11) 9')).toBe(5);
      });
    });

    describe('clamping de posição do cursor', () => {
      it('cursor negativo -> clamped para 0', () => {
        expect(mapCursorPosition('119', -1, '(11) 9')).toBe(1); // após "("
      });

      it('cursor maior que raw length -> clamped para raw length', () => {
        expect(mapCursorPosition('119', 10, '(11) 9')).toBe(6); // final da máscara
      });
    });

    describe('consistência: round-trip raw -> masked -> cursor', () => {
      it('para vários tamanhos de telefone, cursor no final do raw mapeia para final do masked', () => {
        const testCases = [
          { raw: '1', masked: '(1' },
          { raw: '11', masked: '(11' },
          { raw: '119', masked: '(11) 9' },
          { raw: '1198', masked: '(11) 98' },
          { raw: '11987', masked: '(11) 987' },
          { raw: '119876', masked: '(11) 9876' },
          { raw: '1198765', masked: '(11) 9876-5' },
          { raw: '11987654', masked: '(11) 9876-54' },
          { raw: '119876543', masked: '(11) 9876-543' },
          { raw: '1198765432', masked: '(11) 9876-5432' },
          { raw: '11987654321', masked: '(11) 98765-4321' },
        ];

        testCases.forEach(({ raw, masked }) => {
          const cursorPos = raw.length;
          const result = mapCursorPosition(raw, cursorPos, masked);
          expect(result).toBe(masked.length);
        });
      });

      it('cursor em posições intermediárias mantém consistência de dígitos', () => {
        // Para cada posição de cursor no raw, o número de dígitos antes do cursor
        // deve ser igual ao número de dígitos antes do cursor mapeado no masked
        const raw = '11987654321';
        const masked = '(11) 98765-4321';
        
        for (let cursorPos = 0; cursorPos <= raw.length; cursorPos++) {
          const mappedPos = mapCursorPosition(raw, cursorPos, masked);
          
          // Conta dígitos antes do cursor no raw
          const rawBefore = raw.slice(0, cursorPos);
          const digitsBeforeRaw = rawBefore.replace(/\D/g, '').length;
          
          // Conta dígitos antes do cursor mapeado no masked
          const maskedBefore = masked.slice(0, mappedPos);
          const digitsBeforeMasked = maskedBefore.replace(/\D/g, '').length;
          
          expect(digitsBeforeMasked).toBe(digitsBeforeRaw);
        }
      });
    });

    describe('regression: first digit cursor position', () => {
      it('primeiro dígito digitado em campo vazio -> cursor após o dígito, não após "("', () => {
        // Simula: campo vazio, usuário digita "1"
        // Browser reporta selectionStart=0 (stale em controlled input)
        // Correção: deve tratar como cursor=1 (fim do raw value)
        const rawValue = '1';
        const staleCursorPos = 0; // O que o browser reporta no onChange
        const maskedValue = '(1';
        
        // O mapCursorPosition com cursor=0 retorna 1 (após "(")
        // Mas o comportamento correto é cursor=2 (após "1")
        // A correção deve acontecer ANTES de chamar mapCursorPosition
        // (no handlePhoneChange, via prevRawValueRef)
        
        // Teste do comportamento ATUAL do mapCursorPosition (sem correção)
        expect(mapCursorPosition(rawValue, staleCursorPos, maskedValue)).toBe(1);
        
        // Teste do comportamento CORRIGIDO (cursor=1 = rawValue.length)
        expect(mapCursorPosition(rawValue, 1, maskedValue)).toBe(2);
      });

      it('segundo dígito do DDD -> cursor após segundo dígito', () => {
        // Usuário já tem "1", digita "1" -> raw="11"
        // Browser pode reportar selectionStart=1 (após primeiro dígito no raw antigo)
        // Correção: cursor deve ir para 2 (fim do novo raw value)
        const rawValue = '11';
        const maskedValue = '(11';
        
        expect(mapCursorPosition(rawValue, 2, maskedValue)).toBe(3);
      });

      it('digitação no meio do número mantém posição relativa aos dígitos', () => {
        // Usuário tem "(11) 9876" (raw: "119876"), cursor após "987" (posição 5 no raw)
        // Digita "5" no meio -> raw: "1198756", cursor deveria estar após "5" (posição 6)
        const rawValue = '1198756';
        const maskedValue = '(11) 9875-6';
        
        // 5 dígitos antes do cursor no raw (11987)
        // Na máscara, 5 dígitos antes = posição mais à direita com 5 dígitos = após "-" (posição 10)
        // O algoritmo retorna a posição MAIS À DIREITA com a contagem correta de dígitos
        expect(mapCursorPosition(rawValue, 6, maskedValue)).toBe(10);
      });
    });
  });

  describe('correctCursorPosition - regression tests for cursor correction logic', () => {
    describe('first character anomaly (empty -> 1 char)', () => {
      it('prev empty, raw="1", browser reports cursor=0 -> corrected to 1', () => {
        // Simula: campo vazio, usuário digita primeiro dígito
        // Controlled input: browser reporta selectionStart=0 (stale)
        expect(correctCursorPosition('', '1', 0)).toBe(1);
      });

      it('prev empty, raw="1", browser reports cursor=1 -> stays 1', () => {
        expect(correctCursorPosition('', '1', 1)).toBe(1);
      });
    });

    describe('middle insertion (not at end)', () => {
      it('insert in middle: prev="1234", raw="125634", cursor at insertion point (4) -> stays 4', () => {
        // Usuário tem "1234", cursor entre "12" e "34" (posição 2 no raw antigo)
        // Digita "56" -> novo raw "125634", cursor reportado na posição de inserção (4)
        // Antigo bug: rawCursorPos(4) === prevRawValue.length(4) -> classificava como append -> cursor=6 (ERRADO)
        expect(correctCursorPosition('1234', '125634', 4)).toBe(4);
      });

      it('insert at position 1: prev="1234", raw="15234", cursor=2 -> stays 2', () => {
        expect(correctCursorPosition('1234', '15234', 2)).toBe(2);
      });

      it('insert at position 3: prev="1234", raw="12354", cursor=4 -> stays 4', () => {
        expect(correctCursorPosition('1234', '12354', 4)).toBe(4);
      });
    });

    describe('append at end (true append)', () => {
      it('append at end: prev="123", raw="1234", cursor=4 -> stays 4', () => {
        // Digitação normal no final
        expect(correctCursorPosition('123', '1234', 4)).toBe(4);
      });

      it('append at end with cursor at prev length: prev="123", raw="1234", cursor=3 -> stays 3', () => {
        // Browser pode reportar cursor no final do valor antigo
        expect(correctCursorPosition('123', '1234', 3)).toBe(3);
      });
    });

    describe('mid-selection paste (select text in middle and paste)', () => {
      it('select "34" in "1234" (pos 2-4), paste "56" -> raw="1256", cursor at paste end (4) -> stays 4', () => {
        // Usuário seleciona "34" (posições 2-4 no raw "1234")
        // Cola "56" -> novo raw "1256"
        // Browser reporta cursor no final do texto colado (posição 4)
        // Antigo bug: rawCursorPos(4) === prevRawValue.length(4) -> classificava como append
        expect(correctCursorPosition('1234', '1256', 4)).toBe(4);
      });

      it('select "23" in "1234" (pos 1-3), paste "56" -> raw="1564", cursor=3 -> stays 3', () => {
        expect(correctCursorPosition('1234', '1564', 3)).toBe(3);
      });

      it('select all "1234", paste "56" -> raw="56", cursor=2 -> stays 2', () => {
        expect(correctCursorPosition('1234', '56', 2)).toBe(2);
      });
    });

    describe('deletion', () => {
      it('delete from middle: prev="125634", raw="1234", cursor=4 -> clamped to 4', () => {
        expect(correctCursorPosition('125634', '1234', 4)).toBe(4);
      });

      it('delete last char: prev="1234", raw="123", cursor=3 -> stays 3', () => {
        expect(correctCursorPosition('1234', '123', 3)).toBe(3);
      });

      it('delete to empty: prev="1", raw="", cursor=0 -> stays 0', () => {
        expect(correctCursorPosition('1', '', 0)).toBe(0);
      });

      it('cursor beyond new length gets clamped: prev="1234", raw="12", cursor=5 -> clamped to 2', () => {
        expect(correctCursorPosition('1234', '12', 5)).toBe(2);
      });
    });

    describe('same length (replacement)', () => {
      it('replace char at pos 2: prev="1234", raw="1254", cursor=3 -> stays 3', () => {
        expect(correctCursorPosition('1234', '1254', 3)).toBe(3);
      });
    });

    describe('cursor clamping', () => {
      it('negative cursor clamped to 0', () => {
        expect(correctCursorPosition('123', '1234', -1)).toBe(0);
      });

      it('cursor > raw length clamped to raw length', () => {
        expect(correctCursorPosition('123', '1234', 10)).toBe(4);
      });
    });
  });
});