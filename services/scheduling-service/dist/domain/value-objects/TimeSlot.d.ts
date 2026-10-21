export declare class TimeSlot {
    readonly start: Date;
    readonly end: Date;
    constructor(start: Date, end: Date);
    static fromStrings(startStr: string, endStr: string, timeZone: string): TimeSlot;
    overlaps(other: TimeSlot): boolean;
    durationMinutes(): number;
    toString(timeZone: string): string;
}
