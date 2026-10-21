export declare class User {
    readonly id: string;
    readonly email: string;
    readonly passwordHash: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(id: string, email: string, passwordHash: string, createdAt: Date, updatedAt: Date);
    static create(email: string, passwordHash: string): User;
}
//# sourceMappingURL=User.d.ts.map