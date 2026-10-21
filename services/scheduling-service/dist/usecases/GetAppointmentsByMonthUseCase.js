import { ValidationError } from '../domain/errors/DomainError.js';
export class GetAppointmentsByMonthUseCase {
    appointmentRepo;
    constructor(appointmentRepo) {
        this.appointmentRepo = appointmentRepo;
    }
    async execute(monthStr) {
        const match = /^(\d{4})-(\d{2})$/.exec(monthStr);
        if (!match)
            throw new ValidationError('Mês deve estar no formato YYYY-MM');
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        return this.appointmentRepo.findByMonth(year, month);
    }
}
//# sourceMappingURL=GetAppointmentsByMonthUseCase.js.map