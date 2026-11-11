import { describe, expect, it } from 'vitest';
import { Phone, PhoneValidationError } from '../../src/domain/value-objects/Phone.js';

describe('Phone', () => {
  it('normalizes formatting and the Brazilian country prefix to one local number', () => {
    expect(Phone.create('(85) 91234-5678').value).toBe('85912345678');
    expect(Phone.create('+55 (85) 91234-5678').value).toBe('85912345678');
    expect(Phone.create('5585912345678').value).toBe('85912345678');
  });

  it('rejects invalid Brazilian numbers', () => {
    expect(() => Phone.create('+55 85 1234')).toThrow(PhoneValidationError);
  });
});
