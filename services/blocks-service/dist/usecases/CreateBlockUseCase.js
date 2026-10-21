import { Block } from '../domain/entities/Block.js';
import { ValidationError } from '../domain/errors/DomainError.js';
export class CreateBlockUseCase {
    blockRepo;
    appointmentRepo;
    constructor(blockRepo, appointmentRepo) {
        this.blockRepo = blockRepo;
        this.appointmentRepo = appointmentRepo;
    }
    /**
     * Ao bloquear um dia que já tem agendamentos, o sistema avisa
     * e lista os agendamentos afetados (return `affectedAppointments`).
     */
    async execute(input, options) {
        const startsAt = new Date(input.startsAt);
        const endsAt = new Date(input.endsAt);
        if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
            throw new ValidationError('Datas inválidas');
        }
        if (endsAt <= startsAt) {
            throw new ValidationError('Data final deve ser posterior à data inicial');
        }
        const block = Block.create(startsAt, endsAt, input.reason);
        const created = await this.blockRepo.create(block);
        const affected = options?.skipConflictCheck
            ? []
            : await this.appointmentRepo.findByPeriod(startsAt, endsAt);
        return { block: created, affectedAppointments: affected };
    }
}
//# sourceMappingURL=CreateBlockUseCase.js.map