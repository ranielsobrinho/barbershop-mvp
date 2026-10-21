export class Block {
    id;
    startsAt;
    endsAt;
    reason;
    createdAt;
    updatedAt;
    constructor(id, startsAt, endsAt, reason, createdAt, updatedAt) {
        this.id = id;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.reason = reason;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static create(startsAt, endsAt, reason) {
        const now = new Date();
        return new Block(crypto.randomUUID(), startsAt, endsAt, reason?.trim() || null, now, now);
    }
    get isFullDay() {
        const duration = this.endsAt.getTime() - this.startsAt.getTime();
        return duration >= 23 * 60 * 60 * 1000;
    }
}
//# sourceMappingURL=Block.js.map