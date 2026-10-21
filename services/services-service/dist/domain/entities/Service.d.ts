export declare class Service {
    readonly id: string;
    readonly name: string;
    readonly description: string | null;
    readonly priceCents: number;
    readonly slotMin: number;
    readonly active: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(id: string, name: string, description: string | null, priceCents: number, slotMin: number, active: boolean, createdAt: Date, updatedAt: Date);
    static create(name: string, priceCents: number, slotMin: number, description?: string | null, active?: boolean): Service;
    update(name?: string, description?: string | null, priceCents?: number, slotMin?: number, active?: boolean): Service;
}
//# sourceMappingURL=Service.d.ts.map