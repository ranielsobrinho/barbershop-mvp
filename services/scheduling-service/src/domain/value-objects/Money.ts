export class Money {
  private constructor(public readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (cents < 0) throw new Error('Valor não pode ser negativo');
    return new Money(cents);
  }

  format(): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
      .format(this.cents / 100);
  }
}
