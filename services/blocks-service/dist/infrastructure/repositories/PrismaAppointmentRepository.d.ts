import { IAppointmentRepository, AffectedAppointment } from '../../domain/repositories/IAppointmentRepository.js';
export declare class PrismaAppointmentRepository implements IAppointmentRepository {
    findByPeriod(start: Date, end: Date): Promise<AffectedAppointment[]>;
}
