import { Block } from '../entities/Block.js';
export interface IBlockRepository {
    findAll(): Promise<Block[]>;
    findByPeriod(start: Date, end: Date): Promise<Block[]>;
    create(block: Block): Promise<Block>;
    delete(id: string): Promise<void>;
}
