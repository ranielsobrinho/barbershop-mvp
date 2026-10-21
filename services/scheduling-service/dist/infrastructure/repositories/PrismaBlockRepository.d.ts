import { IBlockRepository, BlockSnapshot } from '../../domain/repositories/IBlockRepository.js';
export declare class PrismaBlockRepository implements IBlockRepository {
    findByPeriod(start: Date, end: Date): Promise<BlockSnapshot[]>;
    findConflicting(startsAt: Date, endsAt: Date): Promise<BlockSnapshot[]>;
}
