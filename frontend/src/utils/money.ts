export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}


/**
 * Keeps price input numeric, supports Brazilian comma decimals (including a
 * pasted thousands separator such as R$ 1.234,56), and limits cents to 2 digits.
 */
export function sanitizePriceInput(value: string): string {
  const input = value.replace(/[^\d,.]/g, '');
  const commaIndex = input.lastIndexOf(',');

  if (commaIndex >= 0) {
    const integer = input.slice(0, commaIndex).replace(/\D/g, '');
    const fraction = input.slice(commaIndex + 1).replace(/\D/g, '').slice(0, 2);
    return `${integer},${fraction}`;
  }

  const dotIndices = [...input.matchAll(/\./g)].map((match) => match.index ?? -1);
  if (dotIndices.length === 1) {
    const separatorIndex = dotIndices[0];
    const fraction = input.slice(separatorIndex + 1).replace(/\D/g, '');
    if (fraction.length <= 2) {
      const integer = input.slice(0, separatorIndex).replace(/\D/g, '');
      return `${integer}.${fraction}`;
    }
  }

  // With no comma decimal, multiple dots or >2 trailing digits are treated as
  // grouping punctuation, as in a pasted value like "1.234.567".
  return input.replace(/\D/g, '');
}
