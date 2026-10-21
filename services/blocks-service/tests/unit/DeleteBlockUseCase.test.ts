import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteBlockUseCase } from '../../src/usecases/DeleteBlockUseCase.js';
import { Block } from '../../src/domain/entities/Block.js';
import { NotFoundError } from '../../src/domain/errors/DomainError.js';
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

describe('DeleteBlockUseCase', () => {
  let useCase: DeleteBlockUseCase;
  let repo: MockBlockRepository;

  beforeEach(() => {
    repo = new MockBlockRepository();
    useCase = new DeleteBlockUseCase(repo);
  });

  it('deleta bloqueio existente', async () => {
    const block = Block.create(new Date('2025-01-15T09:00:00'), new Date('2025-01-15T12:00:00'));
    repo.addBlock(block);

    await expect(useCase.execute(block.id)).resolves.toBeUndefined();

    const all = await repo.findAll();
    expect(all).toHaveLength(0);
  });

  it('lança NotFoundError para ID inexistente', async () => {
    await expect(useCase.execute('non-existent-id')).rejects.toThrow(NotFoundError);
  });

  it('lança NotFoundError com mensagem contendo "Bloqueio"', async () => {
    try {
      await useCase.execute('non-existent-id');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundError);
      expect((error as NotFoundError).message).toContain('Bloqueio');
    }
  });
});
