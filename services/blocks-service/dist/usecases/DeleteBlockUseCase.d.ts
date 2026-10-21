import { IBlockRepository } from '../domain/repositories/IBlockRepository.js';
export declare class DeleteBlockUseCase {
    private readonly repo;
    constructor(repo: IBlockRepository);
    execute(id: string): Promise<void>;
}
