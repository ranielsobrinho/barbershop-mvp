import { NotFoundError } from '../domain/errors/DomainError.js';
export class DeleteBlockUseCase {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async execute(id) {
        const all = await this.repo.findAll();
        if (!all.find(b => b.id === id))
            throw new NotFoundError('Bloqueio', id);
        await this.repo.delete(id);
    }
}
//# sourceMappingURL=DeleteBlockUseCase.js.map