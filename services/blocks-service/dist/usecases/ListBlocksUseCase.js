export class ListBlocksUseCase {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async execute(month) {
        if (!month)
            return this.repo.findAll();
        const match = /^(\d{4})-(\d{2})$/.exec(month);
        if (!match)
            return this.repo.findAll();
        const y = parseInt(match[1], 10), m = parseInt(match[2], 10);
        return this.repo.findByPeriod(new Date(Date.UTC(y, m - 1, 1)), new Date(Date.UTC(y, m, 1)));
    }
}
//# sourceMappingURL=ListBlocksUseCase.js.map