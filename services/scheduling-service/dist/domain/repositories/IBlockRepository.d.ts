export interface BlockSnapshot {
    id: string;
    startsAt: Date;
    endsAt: Date;
    reason: string | null;
}
export interface IBlockRepository {
    findByPeriod(start: Date, end: Date): Promise<BlockSnapshot[]>;
    findConflicting(startsAt: Date, endsAt: Date): Promise<BlockSnapshot[]>;
}
