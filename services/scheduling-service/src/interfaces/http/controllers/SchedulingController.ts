import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { GetAvailabilityUseCase } from '../../../usecases/GetAvailabilityUseCase.js';
import { CreateAppointmentUseCase } from '../../../usecases/CreateAppointmentUseCase.js';
import { GetAppointmentsByMonthUseCase } from '../../../usecases/GetAppointmentsByMonthUseCase.js';
import { GetBlockedDatesUseCase } from '../../../usecases/GetBlockedDatesUseCase.js';
import { UpdateAppointmentStatusUseCase } from '../../../usecases/UpdateAppointmentStatusUseCase.js';
import { RescheduleAppointmentUseCase } from '../../../usecases/RescheduleAppointmentUseCase.js';
import { DomainError } from '../../../domain/errors/DomainError.js';

function handleDomainError(reply: FastifyReply, error: unknown): void {
  if (error instanceof DomainError) {
    reply.status(error.statusCode).send({ error: error.code, message: error.message });
    return;
  }
  if (error instanceof z.ZodError) {
    reply.status(400).send({ error: 'VALIDATION_ERROR', message: 'Dados inválidos', details: error.flatten().fieldErrors });
    return;
  }
  reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Erro interno' });
}

const createSchema = z.object({
  serviceId: z.string().min(1),
  customerName: z.string().min(2).max(80),
  customerPhone: z.string().min(10).max(15),
  startsAt: z.string().min(1),
  // honeypot field (anti-abuso): deve vir vazio
  website: z.string().max(0).optional().or(z.literal('')),
});

const statusSchema = z.object({ status: z.string().min(1) });
const rescheduleSchema = z.object({ newStartsAt: z.string().min(1) });

export class SchedulingController {
  constructor(
    private readonly getAvailability: GetAvailabilityUseCase,
    private readonly createAppointment: CreateAppointmentUseCase,
    private readonly getByMonth: GetAppointmentsByMonthUseCase,
    private readonly getBlockedDates: GetBlockedDatesUseCase,
    private readonly updateStatusUseCase: UpdateAppointmentStatusUseCase,
    private readonly reschedule: RescheduleAppointmentUseCase
  ) {}

  async availability(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        serviceId: z.string().min(1),
      }).parse(request.query);

      const slots = await this.getAvailability.execute(query.date, query.serviceId);
      return reply.send({ slots });
    } catch (error) {
      return handleDomainError(reply, error);
    }
  }

  async blockedDates(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/),
      }).parse(request.query);

      const dates = await this.getBlockedDates.execute(query.month);
      return reply.send({ dates });
    } catch (error) {
      return handleDomainError(reply, error);
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const input = createSchema.parse(request.body);
      const appointment = await this.createAppointment.execute({
        serviceId: input.serviceId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        startsAt: input.startsAt,
      });
      return reply.status(201).send({ appointment });
    } catch (error) {
      return handleDomainError(reply, error);
    }
  }

  async listByMonth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }).parse(request.query);
      const appointments = await this.getByMonth.execute(query.month);
      return reply.send({ appointments });
    } catch (error) {
      return handleDomainError(reply, error);
    }
  }

  async updateStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
      const { status } = statusSchema.parse(request.body);
      const appointment = await this.updateStatusUseCase.execute(id, status);
      return reply.send({ appointment });
    } catch (error) {
      return handleDomainError(reply, error);
    }
  }

  async rescheduleAppointment(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
      const { newStartsAt } = rescheduleSchema.parse(request.body);
      const appointment = await this.reschedule.execute(id, newStartsAt);
      return reply.send({ appointment });
    } catch (error) {
      return handleDomainError(reply, error);
    }
  }
}
