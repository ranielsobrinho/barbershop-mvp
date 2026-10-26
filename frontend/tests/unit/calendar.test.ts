import { describe, it, expect } from 'vitest';
import {
  formatBusinessTime,
  getAppointmentsForDay,
  getBusinessMonthStart,
  getMonthGrid,
  isDayBlocked,
} from '../../src/utils/date';

describe('Monthly calendar grid', () => {
  it('renders the selected November 2026 month with November 1 on Sunday', () => {
    const { days, firstDayOffset } = getMonthGrid(new Date(2026, 10, 1));

    expect(days).toHaveLength(30);
    expect(days[0].getDate()).toBe(1);
    expect(firstDayOffset).toBe(0);
    expect(days[0].getDay()).toBe(0);
  });

  it('rebuilds the grid for a month in the next year', () => {
    const { days, firstDayOffset } = getMonthGrid(new Date(2026, 0, 1));

    expect(days).toHaveLength(31);
    expect(days[0].getMonth()).toBe(0);
    expect(firstDayOffset).toBe(4);
  });

  it('initializes the month from the Fortaleza business date, not the browser date', () => {
    const beforeFortalezaMidnight = new Date('2026-11-01T02:30:00.000Z');
    const month = getBusinessMonthStart(beforeFortalezaMidnight);

    expect(month.getFullYear()).toBe(2026);
    expect(month.getMonth()).toBe(9); // October in America/Fortaleza
  });

  it('shows only appointments for the selected month day', () => {
    const appointments = [
      { id: 'oct-31-late', startsAt: '2026-11-01T02:30:00.000Z' },
      { id: 'nov-1', startsAt: '2026-11-01T03:00:00.000Z' },
      { id: 'nov-15', startsAt: '2026-11-15T13:00:00.000Z' },
      { id: 'dec-1', startsAt: '2026-12-01T12:00:00.000Z' },
    ];

    const novemberFirst = getAppointmentsForDay(new Date(2026, 10, 1), appointments);
    const octoberThirtyFirst = getAppointmentsForDay(new Date(2026, 9, 31), appointments);

    expect(novemberFirst.map((appointment) => appointment.id)).toEqual(['nov-1']);
    expect(octoberThirtyFirst.map((appointment) => appointment.id)).toEqual(['oct-31-late']);
  });

  it('formats appointment times in Fortaleza time', () => {
    expect(formatBusinessTime('2026-11-01T12:00:00.000Z')).toBe('09:00');
  });

  it('marks block dates using the Fortaleza calendar day', () => {
    const blocks = [{
      startsAt: '2026-11-01T02:30:00.000Z',
      endsAt: '2026-11-01T04:00:00.000Z',
    }];

    expect(isDayBlocked(new Date(2026, 9, 31), blocks)).toBe(true);
    expect(isDayBlocked(new Date(2026, 10, 1), blocks)).toBe(true);
  });
});
