export interface SettingsRow {
    id: string;
    minNoticeHours: number;
    maxDaysAhead: number;
    heroText: string | null;
    heroImageUrl: string | null;
}
export declare class PrismaSettingsRepository {
    get(): Promise<SettingsRow>;
    update(data: {
        minNoticeHours?: number;
        maxDaysAhead?: number;
        heroText?: string | null;
        heroImageUrl?: string | null;
    }): Promise<SettingsRow>;
}
