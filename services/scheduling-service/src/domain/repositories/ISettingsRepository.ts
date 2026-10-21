export interface SettingsSnapshot {
  minNoticeHours: number;
  maxDaysAhead: number;
}

export interface ISettingsRepository {
  get(): Promise<SettingsSnapshot>;
}
