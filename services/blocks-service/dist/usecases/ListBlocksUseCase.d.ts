import { IBlockRepository } from '../domain/repositories/IBlockRepository.js';
import { Block } from '../domain/entities/Block.js';
export declare class ListBlocksUseCase {
    private readonly repo;
    constructor(repo: IBlockRepository);
    execute(month?: string): Promise<Block[]>;
}
