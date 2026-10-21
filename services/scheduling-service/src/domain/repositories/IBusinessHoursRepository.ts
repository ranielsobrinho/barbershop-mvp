export interface BusinessHoursSnapshot {
  weekday: number; // 0=Sun..6=Sat
  opensAt: string;  // HH:mm
  closesAt: string; // HH:mm
  breakStart: string | null;
  breakEnd: string | null;
  active: boolean;
}

export interface IBusinessHoursRepository {
  findByWeekday(weekday: number): Promise<BusinessHoursSnapshot | null>;
  findAll(): Promise<BusinessHoursSnapshot[]>;
}
