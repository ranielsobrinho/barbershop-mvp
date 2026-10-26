import { describe, expect, it } from 'vitest';
import { formatDateInput, maskDateInput, parseDateInput } from '../../src/utils/dateInput';

describe('Brazilian date input', () => {
  it('formats ISO calendar dates as DD/MM/YYYY', () => {
    expect(formatDateInput('2026-11-05')).toBe('05/11/2026');
  });

  it('masks digits as DD/MM/YYYY while typing', () => {
    expect(maskDateInput('05112026')).toBe('05/11/2026');
    expect(maskDateInput('05a11b2026')).toBe('05/11/2026');
  });

  it('converts a valid Brazilian date to the backend calendar-date format', () => {
    expect(parseDateInput('05/11/2026')).toBe('2026-11-05');
  });

  it('rejects impossible dates and incomplete input', () => {
    expect(parseDateInput('31/02/2026')).toBeNull();
    expect(parseDateInput('05/11/26')).toBeNull();
    expect(parseDateInput('')).toBeNull();
  });
});
