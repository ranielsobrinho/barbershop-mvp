import { AvailabilityService } from '../domain/services/AvailabilityService.js';
import { SchedulingRules } from '../domain/services/SchedulingRules.js';
import { IAppointmentRepository } from '../domain/repositories/IAppointmentRepository.js';
import { IServiceRepository } from '../domain/repositories/IServiceRepository.js';
import { ISettingsRepository } from '../domain/repositories/ISettingsRepository.js';
import { Appointment } from '../domain/entities/Appointment.js';
import { NotFoundError, ValidationError } from '../domain/errors/DomainError.js';
import { Phone } from '../domain/value-objects/Phone.js';
import { addMinutes, parseISO } from 'date-fns';

export interface CreateAppointmentInput {
  serviceId: string;
  customerName: string;
  customerPhone: string;
  startsAt: string; // ISO 8601
}

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly serviceRepo: IServiceRepository,
    private readonly settingsRepo: ISettingsRepository,
    private readonly availability: AvailabilityService,
    private readonly antiAbuseLimit = 5
  ) {}

  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    const settings = await this.settingsRepo.get();
    const rules = new SchedulingRules(settings);

    rules.validateCustomerName(input.customerName);
    try {
      rules.validatePhone(input.customerPhone);
    } catch {
      throw new ValidationError('Telefone inválido. Use formato (11) 9XXXX-XXXX');
    }

    const startsAt = parseISO(input.startsAt);
    if (isNaN(startsAt.getTime())) throw new ValidationError('Data/hora inválida');

    rules.validateSlot(startsAt);

    const service = await this.serviceRepo.findById(input.serviceId);
    if (!service) throw new NotFoundError('Serviço', input.serviceId);
    if (!service.active) throw new ValidationError('Serviço não está ativo');

    const endsAt = addMinutes(startsAt, service.slotMin);

    // Anti-abuso: limite de agendamentos por telefone nas últimas 24h
    const phone = Phone.create(input.customerPhone);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await this.appointmentRepo.countByPhone(phone.value, since);
    if (recentCount >= this.antiAbuseLimit) {
      throw new ValidationError('Limite de agendamentos atingido. Tente novamente mais tarde.');
    }

    // Execute check + write atomically with advisory lock to prevent race conditions
    return this.appointmentRepo.withSlotLock(startsAt, async (tx) => {
      // Re-check availability inside the transaction (after acquiring lock)
      const conflicts = await tx.appointment.findMany({
        where: {
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
          status: { in: ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADO', 'REAGENDADO'] as any },
        },
      });
      if (conflicts.length > 0) {
        throw new ValidationError('Horário não disponível');
      }

      // Re-check blocks inside the transaction
      const blocks = await tx.block.findMany({
        where: {
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      });
      if (blocks.length > 0) {
        throw new ValidationError('Horário bloqueado');
      }

      // Preço copiado do serviço no momento da marcação (histórico)
      const appointment = Appointment.create(
        service.id,
        input.customerName.trim(),
        phone.value,
        startsAt,
        endsAt,
        service.priceCents,
        'AGUARDANDO_CONFIRMACAO'
      );

      const created = await tx.appointment.create({
        data: {
          id: appointment.id,
          serviceId: appointment.serviceId,
          customerName: appointment.customerName,
          customerPhone: appointment.customerPhone,
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
          priceCents: appointment.priceCents,
          status: appointment.status as any,
          previousStartsAt: appointment.previousStartsAt,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        },
      });

      return new Appointment(
        created.id, created.serviceId, created.customerName, created.customerPhone,
        new Date(created.startsAt), new Date(created.endsAt), created.priceCents,
        created.status, created.previousStartsAt ? new Date(created.previousStartsAt) : null,
        new Date(created.createdAt), new Date(created.updatedAt)
      );
    });
  }
}
