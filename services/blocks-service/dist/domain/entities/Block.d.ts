export declare class Block {
    readonly id: string;
    readonly startsAt: Date;
    readonly endsAt: Date;
    readonly reason: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(id: string, startsAt: Date, endsAt: Date, reason: string | null, createdAt: Date, updatedAt: Date);
    static create(startsAt: Date, endsAt: Date, reason?: string): Block;
    get isFullDay(): boolean;
}
