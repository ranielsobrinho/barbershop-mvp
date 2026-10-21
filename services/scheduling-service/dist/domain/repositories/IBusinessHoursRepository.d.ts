export interface BusinessHoursSnapshot {
    weekday: number;
    opensAt: string;
    closesAt: string;
    breakStart: string | null;
    breakEnd: string | null;
    active: boolean;
}
export interface IBusinessHoursRepository {
    findByWeekday(weekday: number): Promise<BusinessHoursSnapshot | null>;
    findAll(): Promise<BusinessHoursSnapshot[]>;
}
