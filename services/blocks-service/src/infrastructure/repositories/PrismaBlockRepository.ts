import { IBlockRepository } from '../../domain/repositories/IBlockRepository.js';
import { Block } from '../../domain/entities/Block.js';
import prisma from '../database/prisma.js';

function toDomain(b: any): Block {
  return new Block(b.id, new Date(b.startsAt), new Date(b.endsAt), b.reason, new Date(b.createdAt), new Date(b.updatedAt));
}

export class PrismaBlockRepository implements IBlockRepository {
  async findAll(): Promise<Block[]> {
    const list = await prisma.block.findMany({ orderBy: { startsAt: 'asc' } });
    return list.map(toDomain);
  }

  async findByPeriod(start: Date, end: Date): Promise<Block[]> {
    const list = await prisma.block.findMany({
      where: { startsAt: { lt: end }, endsAt: { gt: start } },
      orderBy: { startsAt: 'asc' },
    });
    return list.map(toDomain);
  }

  async create(block: Block): Promise<Block> {
    const created = await prisma.block.create({
      data: { id: block.id, startsAt: block.startsAt, endsAt: block.endsAt, reason: block.reason, createdAt: block.createdAt, updatedAt: block.updatedAt },
    });
    return toDomain(created);
  }

  async delete(id: string): Promise<void> {
    await prisma.block.delete({ where: { id } });
  }
}
