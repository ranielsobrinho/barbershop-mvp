export interface BusinessHoursRow {
    id: string;
    weekday: number;
    opensAt: string;
    closesAt: string;
    breakStart: string | null;
    breakEnd: string | null;
    active: boolean;
}
export declare class PrismaBusinessHoursRepository {
    findAll(): Promise<BusinessHoursRow[]>;
    upsert(data: {
        weekday: number;
        opensAt: string;
        closesAt: string;
        breakStart: string | null;
        breakEnd: string | null;
        active: boolean;
    }): Promise<BusinessHoursRow>;
}
