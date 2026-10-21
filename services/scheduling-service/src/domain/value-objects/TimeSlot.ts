import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export class TimeSlot {
  constructor(
    public readonly start: Date,
    public readonly end: Date
  ) {}

  static fromStrings(startStr: string, endStr: string, timeZone: string): TimeSlot {
    const start = fromZonedTime(startStr, timeZone);
    const end = fromZonedTime(endStr, timeZone);
    return new TimeSlot(start, end);
  }

  overlaps(other: TimeSlot): boolean {
    return this.start < other.end && this.end > other.start;
  }

  durationMinutes(): number {
    return (this.end.getTime() - this.start.getTime()) / (1000 * 60);
  }

  toString(timeZone: string): string {
    return `${formatInTimeZone(this.start, timeZone, 'HH:mm')} - ${formatInTimeZone(this.end, timeZone, 'HH:mm')}`;
  }
}
