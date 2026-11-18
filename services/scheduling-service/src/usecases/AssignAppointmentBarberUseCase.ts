import prisma from '../infrastructure/database/prisma.js';
import { IAppointmentRepository } from '../domain/repositories/IAppointmentRepository.js';
import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { AvailabilityService } from '../domain/services/AvailabilityService.js';
import { Appointment } from '../domain/entities/Appointment.js';
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors/DomainError.js';

const SCHEDULE_LOCK_NAMESPACE = 910721;

export class AssignAppointmentBarberUseCase {
  constructor(
    private readonly appointments: IAppointmentRepository,
    private readonly services: IServiceRepository,
    private readonly availability: AvailabilityService,
  ) {}

  async execute(appointmentId: string, barberId: string): Promise<Appointment> {
    const existing = await this.appointments.findById(appointmentId);
    if (!existing) throw new NotFoundError('Agendamento', appointmentId);
    if (existing.startsAt <= new Date() || existing.status === 'CANCELADO') {
      throw new ValidationError('Só é possível alterar o barbeiro de um agendamento futuro ativo.');
    }
    if (existing.barberId === barberId) return existing;

    const service = await this.services.findById(existing.serviceId);
    if (!service) throw new NotFoundError('Serviço', existing.serviceId);

    return prisma.$transaction(async (tx) => {
      // Lock both schedules in stable order so reassignment cannot race with
      // booking, rescheduling, another reassignment, or a booking on the old barber.
      for (const id of [existing.barberId, barberId].sort()) {
        await tx.$queryRawUnsafe(
          'SELECT pg_advisory_xact_lock($1::integer, hashtext($2::text))',
          SCHEDULE_LOCK_NAMESPACE,
          id,
        );
      }

      const current = await tx.appointment.findUnique({ where: { id: appointmentId } });
      if (!current) throw new NotFoundError('Agendamento', appointmentId);
      if (
        current.barberId !== existing.barberId
        || current.startsAt.getTime() !== existing.startsAt.getTime()
        || current.status === 'CANCELADO'
        || current.startsAt <= new Date()
      ) {
        throw new ConflictError('O agendamento foi alterado. Atualize a agenda e tente novamente.');
      }

      const barber = await tx.barber.findFirst({ where: { id: barberId, active: true } });
      if (!barber) throw new NotFoundError('Barbeiro ativo', barberId);

      await this.availability.assertBookable(
        existing.startsAt,
        existing.endsAt,
        appointmentId,
        service.slotMin,
        barberId,
      );

      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: { barberId, updatedAt: new Date() },
        include: { barber: { select: { name: true } } },
      });
      return new Appointment(
        updated.id, updated.serviceId, updated.customerName, updated.customerPhone,
        new Date(updated.startsAt), new Date(updated.endsAt), updated.priceCents,
        updated.status, updated.previousStartsAt ? new Date(updated.previousStartsAt) : null,
        new Date(updated.createdAt), new Date(updated.updatedAt), barber.id, updated.barber.name,
      );
    });
  }
}
