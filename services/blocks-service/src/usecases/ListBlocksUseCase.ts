import { IBlockRepository } from '../domain/repositories/IBlockRepository.js';
import { Block } from '../domain/entities/Block.js';

export class ListBlocksUseCase {
  constructor(private readonly repo: IBlockRepository) {}
  async execute(month?: string): Promise<Block[]> {
    if (!month) return this.repo.findAll();
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) return this.repo.findAll();
    const y = parseInt(match[1], 10), m = parseInt(match[2], 10);
    // Convert Fortaleza's local midnight boundaries (UTC-03) to UTC instants.
    return this.repo.findByPeriod(new Date(Date.UTC(y, m - 1, 1, 3)), new Date(Date.UTC(y, m, 1, 3)));
  }
}
