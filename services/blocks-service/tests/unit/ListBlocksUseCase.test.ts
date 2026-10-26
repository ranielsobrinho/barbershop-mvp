import { describe, it, expect, beforeEach } from 'vitest';
import { ListBlocksUseCase } from '../../src/usecases/ListBlocksUseCase.js';
import { Block } from '../../src/domain/entities/Block.js';
import { IBlockRepository } from '../../src/domain/repositories/IBlockRepository.js';

class MockBlockRepository implements IBlockRepository {
  private blocks: Map<string, Block> = new Map();

  async findAll(): Promise<Block[]> {
    return Array.from(this.blocks.values());
  }

  async findByPeriod(start: Date, end: Date): Promise<Block[]> {
    return Array.from(this.blocks.values()).filter(
      b => b.startsAt < end && b.endsAt > start
    );
  }

  async create(block: Block): Promise<Block> {
    this.blocks.set(block.id, block);
    return block;
  }

  async delete(id: string): Promise<void> {
    this.blocks.delete(id);
  }

  addBlock(block: Block) {
    this.blocks.set(block.id, block);
  }
}

describe('ListBlocksUseCase', () => {
  let useCase: ListBlocksUseCase;
  let repo: MockBlockRepository;

  beforeEach(() => {
    repo = new MockBlockRepository();
    useCase = new ListBlocksUseCase(repo);
  });

  it('retorna todos os bloqueios quando month não é informado', async () => {
    const b1 = Block.create(new Date('2025-01-15T09:00:00'), new Date('2025-01-15T12:00:00'));
    const b2 = Block.create(new Date('2025-02-15T09:00:00'), new Date('2025-02-15T12:00:00'));
    repo.addBlock(b1);
    repo.addBlock(b2);

    const result = await useCase.execute();
    expect(result).toHaveLength(2);
  });

  it('retorna bloqueios filtrados por mês (formato YYYY-MM)', async () => {
    const b1 = Block.create(new Date('2025-01-15T09:00:00'), new Date('2025-01-15T12:00:00'));
    const b2 = Block.create(new Date('2025-02-15T09:00:00'), new Date('2025-02-15T12:00:00'));
    repo.addBlock(b1);
    repo.addBlock(b2);

    const result = await useCase.execute('2025-01');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(b1.id);
  });

  it('retorna vazio para mês sem bloqueios', async () => {
    const result = await useCase.execute('2025-03');
    expect(result).toEqual([]);
  });

  it('retorna todos quando formato de mês é inválido', async () => {
    const b1 = Block.create(new Date('2025-01-15T09:00:00'), new Date('2025-01-15T12:00:00'));
    repo.addBlock(b1);

    const result = await useCase.execute('invalid-month');
    expect(result).toHaveLength(1);
  });

  it('uses Fortaleza local-month boundaries expressed as UTC instants', async () => {
    // Fortaleza is UTC-03: this interval is still Dec 31 locally.
    const b1 = Block.create(new Date('2025-01-01T00:00:00Z'), new Date('2025-01-01T01:00:00Z'));
    // This block crosses Fortaleza midnight into January.
    const b2 = Block.create(new Date('2025-01-01T02:00:00Z'), new Date('2025-01-01T04:00:00Z'));
    // This block is within January locally, even though its end is Feb 1 in UTC.
    const b3 = Block.create(new Date('2025-02-01T01:00:00Z'), new Date('2025-02-01T02:00:00Z'));
    // Starts exactly at February 1 midnight in Fortaleza, so it belongs to February.
    const b4 = Block.create(new Date('2025-02-01T03:00:00Z'), new Date('2025-02-01T04:00:00Z'));
    repo.addBlock(b1);
    repo.addBlock(b2);
    repo.addBlock(b3);
    repo.addBlock(b4);

    const result = await useCase.execute('2025-01');
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual(expect.arrayContaining([b2.id, b3.id]));
  });
});
