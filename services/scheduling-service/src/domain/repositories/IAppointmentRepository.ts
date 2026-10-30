import { Appointment, AppointmentStatus } from '../entities/Appointment.js';

export interface IAppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findByPeriod(start: Date, end: Date, includeCancelled?: boolean): Promise<Appointment[]>;
  findByMonth(year: number, month: number): Promise<Appointment[]>;
  findConflicting(startsAt: Date, endsAt: Date, excludeId?: string): Promise<Appointment[]>;
  create(appointment: Appointment): Promise<Appointment>;
  update(appointment: Appointment): Promise<Appointment>;
  countByPhone(phone: string, since: Date): Promise<number>;
  
  /**
   * Executes a schedule mutation within a transaction protected by a shared
   * advisory lock. The lock serializes overlapping intervals even when they
   * have different start times or service durations.
   * The callback receives a Prisma transaction client.
   */
  withSlotLock<T>(startsAt: Date, callback: (tx: any) => Promise<T>): Promise<T>;
}

export interface IAppointmentLookupRepository {
  findByPhone(phone: string): Promise<Array<{ appointment: Appointment; serviceName: string }>>;
}
