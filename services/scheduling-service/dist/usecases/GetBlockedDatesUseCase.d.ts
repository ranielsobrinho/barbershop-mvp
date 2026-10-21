import { IBlockRepository } from '../domain/repositories/IBlockRepository.js';
export declare class GetBlockedDatesUseCase {
    private readonly blockRepo;
    constructor(blockRepo: IBlockRepository);
    /** Retorna datas (YYYY-MM-DD) totalmente bloqueadas do mês. */
    execute(monthStr: string): Promise<string[]>;
}
