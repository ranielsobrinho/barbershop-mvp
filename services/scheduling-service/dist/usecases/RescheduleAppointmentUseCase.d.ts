import { IAppointmentRepository } from '../domain/repositories/IAppointmentRepository.js';
import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { ISettingsRepository } from '../domain/repositories/ISettingsRepository.js';
import { AvailabilityService } from '../domain/services/AvailabilityService.js';
import { Appointment } from '../domain/entities/Appointment.js';
export declare class RescheduleAppointmentUseCase {
    private readonly appointmentRepo;
    private readonly serviceRepo;
    private readonly settingsRepo;
    private readonly availability;
    constructor(appointmentRepo: IAppointmentRepository, serviceRepo: IServiceRepository, settingsRepo: ISettingsRepository, availability: AvailabilityService);
    execute(id: string, newStartsAtStr: string): Promise<Appointment>;
}
