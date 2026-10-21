import { FastifyRequest, FastifyReply } from 'fastify';
import { GetAvailabilityUseCase } from '../../../usecases/GetAvailabilityUseCase.js';
import { CreateAppointmentUseCase } from '../../../usecases/CreateAppointmentUseCase.js';
import { GetAppointmentsByMonthUseCase } from '../../../usecases/GetAppointmentsByMonthUseCase.js';
import { GetBlockedDatesUseCase } from '../../../usecases/GetBlockedDatesUseCase.js';
import { UpdateAppointmentStatusUseCase } from '../../../usecases/UpdateAppointmentStatusUseCase.js';
import { RescheduleAppointmentUseCase } from '../../../usecases/RescheduleAppointmentUseCase.js';
export declare class SchedulingController {
    private readonly getAvailability;
    private readonly createAppointment;
    private readonly getByMonth;
    private readonly getBlockedDates;
    private readonly updateStatusUseCase;
    private readonly reschedule;
    constructor(getAvailability: GetAvailabilityUseCase, createAppointment: CreateAppointmentUseCase, getByMonth: GetAppointmentsByMonthUseCase, getBlockedDates: GetBlockedDatesUseCase, updateStatusUseCase: UpdateAppointmentStatusUseCase, reschedule: RescheduleAppointmentUseCase);
    availability(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    blockedDates(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    create(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    listByMonth(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    updateStatus(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    rescheduleAppointment(request: FastifyRequest, reply: FastifyReply): Promise<void>;
}
