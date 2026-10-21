import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository.js';
import { Appointment } from '../../domain/entities/Appointment.js';
export declare class PrismaAppointmentRepository implements IAppointmentRepository {
    findById(id: string): Promise<Appointment | null>;
    findByPeriod(start: Date, end: Date, includeCancelled?: boolean): Promise<Appointment[]>;
    findByMonth(year: number, month: number): Promise<Appointment[]>;
    findConflicting(startsAt: Date, endsAt: Date, excludeId?: string): Promise<Appointment[]>;
    create(appointment: Appointment): Promise<Appointment>;
    update(appointment: Appointment): Promise<Appointment>;
    countByPhone(phone: string, since: Date): Promise<number>;
    withSlotLock<T>(startsAt: Date, callback: (tx: any) => Promise<T>): Promise<T>;
}
