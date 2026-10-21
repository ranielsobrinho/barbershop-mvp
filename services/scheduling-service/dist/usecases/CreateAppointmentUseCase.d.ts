import { AvailabilityService } from '../domain/services/AvailabilityService.js';
import { IAppointmentRepository } from '../domain/repositories/IAppointmentRepository.js';
import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { ISettingsRepository } from '../domain/repositories/ISettingsRepository.js';
import { Appointment } from '../domain/entities/Appointment.js';
export interface CreateAppointmentInput {
    serviceId: string;
    customerName: string;
    customerPhone: string;
    startsAt: string;
}
export declare class CreateAppointmentUseCase {
    private readonly appointmentRepo;
    private readonly serviceRepo;
    private readonly settingsRepo;
    private readonly availability;
    private readonly antiAbuseLimit;
    constructor(appointmentRepo: IAppointmentRepository, serviceRepo: IServiceRepository, settingsRepo: ISettingsRepository, availability: AvailabilityService, antiAbuseLimit?: number);
    execute(input: CreateAppointmentInput): Promise<Appointment>;
}
