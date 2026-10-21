import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
export class TimeSlot {
    start;
    end;
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
    static fromStrings(startStr, endStr, timeZone) {
        const start = fromZonedTime(startStr, timeZone);
        const end = fromZonedTime(endStr, timeZone);
        return new TimeSlot(start, end);
    }
    overlaps(other) {
        return this.start < other.end && this.end > other.start;
    }
    durationMinutes() {
        return (this.end.getTime() - this.start.getTime()) / (1000 * 60);
    }
    toString(timeZone) {
        return `${formatInTimeZone(this.start, timeZone, 'HH:mm')} - ${formatInTimeZone(this.end, timeZone, 'HH:mm')}`;
    }
}
//# sourceMappingURL=TimeSlot.js.map