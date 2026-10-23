/** Máscara de telefone brasileiro: (11) 9XXXX-XXXX */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return /^(\d{10}|\d{11})$/.test(digits);
}

export function formatPhone(digits: string): string {
  return maskPhone(digits);
}

/**
 * Calcula a posição do cursor na string mascarada correspondente à posição do cursor na string bruta.
 * 
 * @param rawValue - Valor bruto do input (o que o usuário digitou)
 * @param rawCursorPos - Posição do cursor no valor bruto (0-indexed)
 * @param maskedValue - Valor já mascarado (resultado de maskPhone(rawValue))
 * @returns Posição do cursor na string mascarada (0-indexed)
 * 
 * Lógica simples e robusta:
 * 1. Conta quantos dígitos existem ANTES do cursor no valor bruto
 * 2. Percorre a string mascarada contando dígitos até cada posição de cursor
 * 3. Retorna a posição MAIS À DIREITA onde a contagem de dígitos coincide
 *    (isso coloca o cursor após qualquer formatação do grupo de dígitos concluído)
 */
export function mapCursorPosition(
  rawValue: string,
  rawCursorPos: number,
  maskedValue: string
): number {
  // Clamp cursor position to valid range
  const clampedCursorPos = Math.max(0, Math.min(rawCursorPos, rawValue.length));
  
  // Conta dígitos ANTES do cursor no valor bruto (ignora formatação no raw)
  const rawBeforeCursor = rawValue.slice(0, clampedCursorPos);
  let digitsBeforeCursor = rawBeforeCursor.replace(/\D/g, '').length;
  
  // FIX: Clamp digitsBeforeCursor to max digits in maskedValue
  // maskPhone truncates to 11 digits, so raw can have more digits than masked
  const maxMaskedDigits = maskedValue.replace(/\D/g, '').length;
  if (digitsBeforeCursor > maxMaskedDigits) {
    digitsBeforeCursor = maxMaskedDigits;
  }
  
  // Se não há dígitos antes do cursor, cursor vai para a posição do primeiro dígito na máscara
  // (após '(' se houver), ou 0 se máscara vazia
  if (digitsBeforeCursor === 0) {
    const firstDigitIndex = maskedValue.search(/\d/);
    return firstDigitIndex >= 0 ? firstDigitIndex : 0;
  }
  
  // Percorre posições de cursor na máscara (0 a length)
  // Mantém contagem de dígitos vistos ANTES de cada posição
  let digitCount = 0;
  let lastMatchingPos = 0;
  
  // Posição 0: antes do primeiro caractere
  if (digitCount === digitsBeforeCursor) {
    lastMatchingPos = 0;
  }
  
  for (let i = 0; i < maskedValue.length; i++) {
    const char = maskedValue[i];
    if (/\d/.test(char)) {
      digitCount++;
    }
    // Posição i+1: após o caractere i
    const cursorPos = i + 1;
    if (digitCount === digitsBeforeCursor) {
      lastMatchingPos = cursorPos;
    }
  }
  
  // Verifica posição final (após último caractere)
  if (digitCount === digitsBeforeCursor) {
    lastMatchingPos = maskedValue.length;
  }
  
  return lastMatchingPos;
}

/**
 * Calcula a posição corrigida do cursor após uma mudança no valor bruto do input de telefone.
 * 
 * Substitui a heurística anterior (rawCursorPos === prevRawValue.length) que classificava
 * incorretamente inserções no meio/pastes de seleção que terminavam no comprimento antigo
 * como "append" (fim), fazendo o caret pular para o final.
 * 
 * @param prevRawValue - Valor bruto anterior
 * @param rawValue - Novo valor bruto
 * @param rawCursorPos - Posição do cursor reportada pelo browser (selectionStart)
 * @returns Posição corrigida do cursor no valor bruto novo
 * 
 * Regras:
 * 1. Inserção (rawValue > prevRawValue):
 *    - Caso especial: primeiro caractere em campo vazio (prevRawValue="" + rawValue.length=1 + cursor=0) -> cursor=1
 *    - Demais casos: confia no selectionStart reportado (evita falsa classificação de meio como fim)
 * 2. Deleção (rawValue < prevRawValue): clamp para rawValue.length
 * 3. Mesmo comprimento: mantém cursor reportado (clampado)
 */
export function correctCursorPosition(
  prevRawValue: string,
  rawValue: string,
  rawCursorPos: number
): number {
  // Clamp cursor position to valid range
  const clampedCursorPos = Math.max(0, Math.min(rawCursorPos, rawValue.length));
  
  if (rawValue.length > prevRawValue.length) {
    // Inserção de caractere(s)
    // Caso especial estreito: primeiro caractere digitado em campo vazio
    // Browser reporta selectionStart=0 (stale em controlled input), mas cursor deve estar após o caractere
    if (prevRawValue.length === 0 && rawValue.length === 1 && clampedCursorPos === 0) {
      return 1;
    }
    // Para todas as outras inserções (meio, fim, paste), confia no selectionStart
    // Isso evita o bug onde rawCursorPos === prevRawValue.length classificava
    // inserção no meio/paste de seleção no meio como "append"
    return clampedCursorPos;
  } else if (rawValue.length < prevRawValue.length) {
    // Deleção: cursor geralmente correto, mas clamp para novo comprimento
    return clampedCursorPos;
  }
  // Mesmo comprimento (ex: substituição): mantém cursor clampado
  return clampedCursorPos;
}

/**
 * Tipo para o token de cancelamento usado em operações assíncronas de cursor
 */
export interface CursorCancellationToken {
  cancelled: boolean;
}

/**
 * Cria um token de cancelamento para operações de cursor
 */
export function createCursorCancellationToken(): CursorCancellationToken {
  return { cancelled: false };
}
