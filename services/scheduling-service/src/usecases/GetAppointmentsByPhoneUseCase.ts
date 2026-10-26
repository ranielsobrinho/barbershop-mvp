import { IAppointmentLookupRepository } from '../domain/repositories/IAppointmentRepository.js';
import { ValidationError } from '../domain/errors/DomainError.js';

export class GetAppointmentsByPhoneUseCase {
  constructor(private readonly appointmentRepo: IAppointmentLookupRepository) {}

  async execute(rawPhone: string) {
    const phone = rawPhone.replace(/\D/g, '');
    if (!/^\d{10,11}$/.test(phone)) throw new ValidationError('Informe um telefone válido com DDD');

    const records = await this.appointmentRepo.findByPhone(phone);
    return records.map(({ appointment, serviceName }) => ({
      serviceName,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      priceCents: appointment.priceCents,
      status: appointment.status,
      previousStartsAt: appointment.previousStartsAt,
    }));
  }
}
