import { IAppointmentRepository } from '../domain/repositories/IAppointmentRepository.js';
import { ConflictChecker } from '../domain/services/ConflictChecker.js';
import { Appointment } from '../domain/entities/Appointment.js';
export declare class UpdateAppointmentStatusUseCase {
    private readonly appointmentRepo;
    private readonly conflictChecker;
    constructor(appointmentRepo: IAppointmentRepository, conflictChecker: ConflictChecker);
    execute(id: string, status: string): Promise<Appointment>;
}
