import { IBlockRepository } from '../../domain/repositories/IBlockRepository.js';
import { Block } from '../../domain/entities/Block.js';
export declare class PrismaBlockRepository implements IBlockRepository {
    findAll(): Promise<Block[]>;
    findByPeriod(start: Date, end: Date): Promise<Block[]>;
    create(block: Block): Promise<Block>;
    delete(id: string): Promise<void>;
}
