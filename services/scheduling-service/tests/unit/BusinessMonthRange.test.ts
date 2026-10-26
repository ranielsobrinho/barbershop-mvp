import { describe, expect, it } from 'vitest';
import { getBusinessMonthUtcRange } from '../../src/domain/services/BusinessMonthRange.js';

describe('getBusinessMonthUtcRange', () => {
  it('includes local October 31 appointments that fall on November 1 in UTC', () => {
    const { start, end } = getBusinessMonthUtcRange(2026, 10);
    const startsAt = new Date('2026-11-01T02:30:00.000Z');

    expect(startsAt >= start && startsAt < end).toBe(true);
  });

  it('starts November at midnight in Fortaleza and ends before December', () => {
    const { start, end } = getBusinessMonthUtcRange(2026, 11);

    expect(start.toISOString()).toBe('2026-11-01T03:00:00.000Z');
    expect(end.toISOString()).toBe('2026-12-01T03:00:00.000Z');
  });
});
