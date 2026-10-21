import { IBlockRepository } from '../domain/repositories/IBlockRepository.js';
import { NotFoundError } from '../domain/errors/DomainError.js';

export class DeleteBlockUseCase {
  constructor(private readonly repo: IBlockRepository) {}
  async execute(id: string): Promise<void> {
    const all = await this.repo.findAll();
    if (!all.find(b => b.id === id)) throw new NotFoundError('Bloqueio', id);
    await this.repo.delete(id);
  }
}
