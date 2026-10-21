import { IAppointmentRepository } from '../domain/repositories/IAppointmentRepository.js';
import { Appointment } from '../domain/entities/Appointment.js';
import { ValidationError } from '../domain/errors/DomainError.js';

export class GetAppointmentsByMonthUseCase {
  constructor(private readonly appointmentRepo: IAppointmentRepository) {}

  async execute(monthStr: string): Promise<Appointment[]> {
    const match = /^(\d{4})-(\d{2})$/.exec(monthStr);
    if (!match) throw new ValidationError('Mês deve estar no formato YYYY-MM');

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);

    return this.appointmentRepo.findByMonth(year, month);
  }
}
