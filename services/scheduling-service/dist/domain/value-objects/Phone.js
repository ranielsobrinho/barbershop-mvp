export class Phone {
    value;
    constructor(value) {
        this.value = value;
    }
    static create(raw) {
        const digits = raw.replace(/\D/g, '');
        if (!/^(\d{10}|\d{11})$/.test(digits)) {
            throw new PhoneValidationError();
        }
        if (!/^(\d{2})9?\d{8}$/.test(digits)) {
            throw new PhoneValidationError();
        }
        return new Phone(digits);
    }
    format() {
        const d = this.value;
        if (d.length === 11) {
            return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
        }
        return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    }
}
export class PhoneValidationError extends Error {
    constructor() {
        super('Telefone inválido. Use formato (11) 9XXXX-XXXX');
        this.name = 'PhoneValidationError';
    }
}
//# sourceMappingURL=Phone.js.map