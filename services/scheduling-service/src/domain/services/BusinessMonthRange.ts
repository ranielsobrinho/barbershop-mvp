/**
 * Calendar-month boundaries for America/Fortaleza, expressed as UTC instants.
 * Fortaleza is fixed at UTC-03:00 (no daylight-saving transition).
 */
export function getBusinessMonthUtcRange(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, month - 1, 1, 3)),
    end: new Date(Date.UTC(year, month, 1, 3)),
  };
}
