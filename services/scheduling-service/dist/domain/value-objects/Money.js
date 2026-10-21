export class Money {
    cents;
    constructor(cents) {
        this.cents = cents;
    }
    static fromCents(cents) {
        if (cents < 0)
            throw new Error('Valor não pode ser negativo');
        return new Money(cents);
    }
    format() {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
            .format(this.cents / 100);
    }
}
//# sourceMappingURL=Money.js.map