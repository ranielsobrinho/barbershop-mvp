export class User {
    id;
    email;
    passwordHash;
    createdAt;
    updatedAt;
    constructor(id, email, passwordHash, createdAt, updatedAt) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static create(email, passwordHash) {
        const now = new Date();
        return new User(crypto.randomUUID(), email, passwordHash, now, now);
    }
}
//# sourceMappingURL=User.js.map