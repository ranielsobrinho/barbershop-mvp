import { Appointment } from '../entities/Appointment.js';
export interface IAppointmentRepository {
    findById(id: string): Promise<Appointment | null>;
    findByPeriod(start: Date, end: Date, includeCancelled?: boolean): Promise<Appointment[]>;
    findByMonth(year: number, month: number): Promise<Appointment[]>;
    findConflicting(startsAt: Date, endsAt: Date, excludeId?: string): Promise<Appointment[]>;
    create(appointment: Appointment): Promise<Appointment>;
    update(appointment: Appointment): Promise<Appointment>;
    countByPhone(phone: string, since: Date): Promise<number>;
    /**
     * Executes a callback within a transaction with an advisory lock on the given time slot.
     * Uses pg_advisory_xact_lock(hashtext(startsAtISO)) to serialize concurrent creations for the same start time.
     * The callback receives a Prisma transaction client.
     */
    withSlotLock<T>(startsAt: Date, callback: (tx: any) => Promise<T>): Promise<T>;
}
