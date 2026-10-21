import { IAppointmentRepository } from '../domain/repositories/IAppointmentRepository.js';
import { Appointment } from '../domain/entities/Appointment.js';
export declare class GetAppointmentsByMonthUseCase {
    private readonly appointmentRepo;
    constructor(appointmentRepo: IAppointmentRepository);
    execute(monthStr: string): Promise<Appointment[]>;
}
