export class Phone {
  private constructor(public readonly value: string) {}

  static create(raw: string): Phone {
    let digits = raw.replace(/\D/g, '');
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
      digits = digits.slice(2);
    }
    if (!/^(\d{10}|\d{11})$/.test(digits)) {
      throw new PhoneValidationError();
    }
    if (!/^(\d{2})9?\d{8}$/.test(digits)) {
      throw new PhoneValidationError();
    }
    return new Phone(digits);
  }

  format(): string {
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
