export class Block {
  constructor(
    public readonly id: string,
    public readonly startsAt: Date,
    public readonly endsAt: Date,
    public readonly reason: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(startsAt: Date, endsAt: Date, reason?: string): Block {
    const now = new Date();
    return new Block(crypto.randomUUID(), startsAt, endsAt, reason?.trim() || null, now, now);
  }

  get isFullDay(): boolean {
    const duration = this.endsAt.getTime() - this.startsAt.getTime();
    return duration >= 23 * 60 * 60 * 1000;
  }
}
